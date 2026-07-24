import Phaser from 'phaser';
import { chairFirst, chairFlower, chairTurned, mothGreeting, mothQuestions, pathAppears } from '../content/prologue';
import { Dreamer } from '../entities/Dreamer';
import { AudioCue, PALETTE, PROLOGUE_GEOMETRY, SceneId, TextureKey } from '../game/config';
import {
  assetRegistry,
  audioManager,
  dialogueSystem,
  hud,
  saveService,
  stateStore,
} from '../game/services';
import type { MothQuestion } from '../state/GameState';
import { InteractionSystem } from '../systems/InteractionSystem';
import { resolveWorldWrap } from '../systems/WorldWrap';

const roomX = (x: number): number => x + PROLOGUE_GEOMETRY.roomOffsetX;
const roomY = (y: number): number => y + PROLOGUE_GEOMETRY.roomOffsetY;

export class PrologueScene extends Phaser.Scene {
  private dreamer!: Dreamer;
  private chair!: Phaser.GameObjects.Image;
  private flower: Phaser.GameObjects.Image | null = null;
  private moth: Phaser.GameObjects.Image | null = null;
  private path!: Phaser.GameObjects.Graphics;
  private readonly interactions = new InteractionSystem();
  private transitioning = false;

  constructor() {
    super(SceneId.Prologue);
  }

  create(): void {
    this.transitioning = false;
    this.interactions.clear();
    this.cameras.main.setBackgroundColor(PALETTE.black);
    this.physics.world.setBounds(0, 0, PROLOGUE_GEOMETRY.worldWidth, PROLOGUE_GEOMETRY.worldHeight);
    this.cameras.main.setBounds(0, 0, PROLOGUE_GEOMETRY.worldWidth, PROLOGUE_GEOMETRY.worldHeight);
    audioManager.attach(this);
    audioManager.stopAmbience();
    audioManager.setMuted(stateStore.snapshot.preferences.muted);
    hud.show(true);
    hud.showHelp();

    const ground = this.add.graphics();
    ground.fillStyle(PALETTE.paper, 1);
    ground.fillEllipse(roomX(160), roomY(101), 112, 82);
    ground.fillStyle(PALETTE.violetLight, 0.28);
    ground.fillRect(roomX(125), roomY(127), 2, 1);
    ground.fillRect(roomX(189), roomY(78), 1, 2);
    ground.fillRect(roomX(139), roomY(67), 1, 1);

    this.path = this.add.graphics().setDepth(1);
    this.chair = this.add.image(roomX(160), roomY(80), assetRegistry.resolve(this, TextureKey.Chair)).setDepth(10);
    this.physics.add.existing(this.chair, true);

    const start = stateStore.snapshot.lastSafe.scene === SceneId.Prologue
      ? stateStore.snapshot.lastSafe.position
      : { x: PROLOGUE_GEOMETRY.spawnX, y: PROLOGUE_GEOMETRY.spawnY };
    this.dreamer = new Dreamer(this, start.x, start.y, stateStore, audioManager, assetRegistry, false);
    this.physics.add.collider(this.dreamer, this.chair);
    this.cameras.main.startFollow(this.dreamer, true, 0.09, 0.09);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.centerOn(this.dreamer.x, this.dreamer.y);

    this.interactions.add({
      id: 'prologue-chair',
      kind: 'object',
      x: roomX(160),
      y: roomY(82),
      radius: 12,
      interact: () => this.inspectChair(),
    });

    this.syncWorld(false);
  }

  update(_time: number, delta: number): void {
    if (!this.dreamer || this.transitioning) return;
    this.dreamer.update(delta);

    if (this.dreamer.consumeInteract()) {
      void this.interactions.tryInteract(this.dreamer, this.dreamer.facingDirection);
    }

    const body = this.dreamer.body as Phaser.Physics.Arcade.Body;
    if (
      stateStore.snapshot.prologue.pathRevealed &&
      body.velocity.x > 0 &&
      this.dreamer.x >= PROLOGUE_GEOMETRY.pathExitX &&
      this.dreamer.x <= PROLOGUE_GEOMETRY.pathExitX + 24 &&
      this.dreamer.y > PROLOGUE_GEOMETRY.pathMinY &&
      this.dreamer.y < PROLOGUE_GEOMETRY.pathMaxY
    ) {
      void this.enterGarden();
      return;
    }

    const wrap = resolveWorldWrap(this.dreamer, {
      width: PROLOGUE_GEOMETRY.worldWidth,
      height: PROLOGUE_GEOMETRY.worldHeight,
      margin: PROLOGUE_GEOMETRY.wrapMargin,
      inset: PROLOGUE_GEOMETRY.wrapInset,
    });
    if (wrap) this.performLoop(wrap.position.x, wrap.position.y);
  }

  private async inspectChair(): Promise<void> {
    const prologue = stateStore.snapshot.prologue;
    const pages = prologue.chairTurned ? chairTurned : prologue.flowerRevealed ? chairFlower : chairFirst;
    await dialogueSystem.run(pages, (locked) => this.dreamer.setInputLocked(locked));
  }

  private async inspectMoth(): Promise<void> {
    if (this.transitioning) return;
    const lock = (locked: boolean): void => this.dreamer.setInputLocked(locked);
    await dialogueSystem.conversation(lock, async (present) => {
      if (stateStore.snapshot.prologue.pathRevealed) {
        await present(pathAppears);
        return;
      }

      const initialAsked = stateStore.snapshot.prologue.askedQuestions;
      const initialRemaining = (Object.keys(mothQuestions) as MothQuestion[])
        .filter((question) => !initialAsked.includes(question));
      const initialPages = initialAsked.length === 0
        ? mothGreeting
        : mothQuestions[initialAsked.at(-1) ?? 'where'].answer;
      let selected = await present(
        initialPages,
        initialRemaining.map((question) => ({ id: question, label: mothQuestions[question].label })),
      ) as MothQuestion | undefined;

      while (selected) {
        const answer = mothQuestions[selected].answer;
        stateStore.askMothQuestion(selected);
        stateStore.setSafePosition(this.dreamer);
        saveService.save(stateStore.snapshot);

        const asked = stateStore.snapshot.prologue.askedQuestions;
        const remaining = (Object.keys(mothQuestions) as MothQuestion[])
          .filter((question) => !asked.includes(question));
        if (remaining.length > 0) {
          selected = await present(
            answer,
            remaining.map((question) => ({ id: question, label: mothQuestions[question].label })),
          ) as MothQuestion | undefined;
          continue;
        }

        await present(answer);
        await present(pathAppears);
        stateStore.revealPath();
        stateStore.setSafePosition(this.dreamer);
        saveService.save(stateStore.snapshot);
        audioManager.cue(AudioCue.Path);
        this.materializePath(true);
        break;
      }
    });
  }

  private performLoop(x: number, y: number): void {
    if (this.transitioning) return;
    const previousLoop = stateStore.snapshot.prologue.loopCount;
    this.dreamer.teleport(x, y, true);
    this.cameras.main.centerOn(x, y);
    const nextLoop = stateStore.advancePrologueLoop();
    audioManager.cue(AudioCue.Loop);
    if (nextLoop > previousLoop) this.syncWorld(true);
    stateStore.setSafePosition(this.dreamer);
    saveService.save(stateStore.snapshot);
  }

  private syncWorld(animate: boolean): void {
    const prologue = stateStore.snapshot.prologue;
    this.chair.setAngle(prologue.chairTurned ? 6 : 0);

    if (prologue.flowerRevealed && !this.flower) {
      this.flower = this.add.image(roomX(181), roomY(89), assetRegistry.resolve(this, TextureKey.Flower)).setDepth(9);
      this.flower.setAlpha(animate ? 0 : 1);
      if (animate) this.tweens.add({ targets: this.flower, alpha: 1, duration: 600 });
      this.interactions.add({
        id: 'prologue-flower',
        kind: 'object',
        x: roomX(181),
        y: roomY(90),
        radius: 8,
        interact: async () => {
          await dialogueSystem.run(
            [{ text: 'A purple flower. It is facing the chair.' }],
            (locked) => this.dreamer.setInputLocked(locked),
          );
        },
      });
    }

    if (prologue.mothAppeared && !this.moth) {
      this.moth = this.add.image(roomX(160), roomY(117), assetRegistry.resolve(this, TextureKey.Moth0)).setDepth(30);
      this.moth.setAlpha(animate ? 0 : 1);
      if (animate) this.tweens.add({ targets: this.moth, alpha: 1, y: roomY(114), duration: 700, ease: 'Sine.out' });
      if (!stateStore.snapshot.preferences.reducedMotion) {
        this.tweens.add({ targets: this.moth, y: '+=2', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      this.interactions.add({
        id: 'prologue-moth',
        kind: 'npc',
        x: roomX(160),
        y: roomY(117),
        radius: 10,
        interact: () => this.inspectMoth(),
      });
    }

    if (prologue.pathRevealed) this.materializePath(false);
  }

  private materializePath(animate: boolean): void {
    this.path.clear();
    this.path.fillStyle(PALETTE.paper, 1);
    this.path.fillRoundedRect(roomX(203), roomY(91), 130, 30, 8);
    this.path.fillStyle(PALETTE.violetLight, 0.55);
    for (let x = 212; x < 320; x += 14) this.path.fillRect(roomX(x), roomY(105 + (x % 3)), 3, 2);
    this.path.setAlpha(animate ? 0 : 1);
    if (animate) this.tweens.add({ targets: this.path, alpha: 1, duration: 900, ease: 'Sine.inOut' });
  }

  private async enterGarden(): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    this.dreamer.setInputLocked(true);
    stateStore.setScene(SceneId.VioletGarden, { x: 54, y: 302 });
    saveService.save(stateStore.snapshot);
    this.cameras.main.fadeOut(700, 255, 250, 242);
    await this.wait(720);
    this.scene.start(SceneId.VioletGarden);
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(milliseconds, resolve));
  }
}
