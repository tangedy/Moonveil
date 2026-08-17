import Phaser from 'phaser';
import { houseDialogue } from '../content/houseWithoutDoors';
import { Dreamer } from '../entities/Dreamer';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SceneId, TextureKey, type SceneId as SceneName } from '../game/config';
import {
  assetRegistry,
  audioManager,
  dialogueOverlay,
  dialogueSystem,
  hud,
  pauseMenuOverlay,
  saveService,
  stateStore,
} from '../game/services';
import type { HouseRoomId, Position } from '../state/GameState';
import { InteractionSystem, type InteractionTarget } from '../systems/InteractionSystem';
import type { DialogueChoice, DialoguePage } from '../ui/DialogueOverlay';

interface HouseSceneData {
  spawn?: Position;
}

export abstract class HouseRoomScene extends Phaser.Scene {
  protected dreamer!: Dreamer;
  protected readonly interactions = new InteractionSystem();
  protected colliders!: Phaser.Physics.Arcade.StaticGroup;
  protected transitioning = false;
  private requestedSpawn: Position | null = null;

  protected constructor(
    key: SceneName,
    protected readonly roomId: HouseRoomId,
    protected readonly roomTitle: string,
    private readonly emptyMessage: string,
  ) {
    super(key);
  }

  init(data: HouseSceneData): void {
    this.requestedSpawn = data.spawn ?? null;
  }

  create(): void {
    this.transitioning = false;
    this.interactions.clear();
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBackgroundColor(PALETTE.ink);
    audioManager.attach(this);
    audioManager.setMuted(stateStore.snapshot.preferences.muted);
    audioManager.startHouseAmbience();

    this.drawRoomShell();
    this.colliders = this.physics.add.staticGroup();
    this.buildBoundaryCollision();
    this.buildRoom();

    const saved = stateStore.snapshot.lastSafe.scene === this.scene.key
      ? stateStore.snapshot.lastSafe.position
      : null;
    const start = this.requestedSpawn ?? saved ?? this.defaultSpawn();
    this.requestedSpawn = null;
    this.dreamer = new Dreamer(this, start.x, start.y, stateStore, audioManager, assetRegistry, true);
    this.physics.add.collider(this.dreamer, this.colliders);
    this.configureCamera();

    pauseMenuOverlay.attach({
      canOpen: () => !dialogueOverlay.isVisible && !this.transitioning,
      onVisibilityChange: (open) => this.dreamer.setInputLocked(open),
      onSave: () => this.checkpoint(),
      onLeaveGame: () => {
        this.scene.start(SceneId.Launch);
      },
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => pauseMenuOverlay.detach());

    this.registerRoomInteractions();
    stateStore.enterHouseRoom(this.roomId);
    stateStore.setScene(this.scene.key as SceneName, start);
    saveService.save(stateStore.snapshot);

    this.transitioning = true;
    this.dreamer.setInputLocked(true);
    this.cameras.main.fadeIn(260, 8, 5, 13);
    this.time.delayedCall(280, () => {
      this.transitioning = false;
      this.dreamer.setInputLocked(false);
    });
  }

  update(_time: number, delta: number): void {
    if (!this.dreamer || this.transitioning) return;
    this.dreamer.update(delta);
    if (this.dreamer.consumeInteract()) void this.tryInteraction();
  }

  protected abstract defaultSpawn(): Position;
  protected abstract buildRoom(): void;
  protected abstract registerRoomInteractions(): void;

  protected get worldWidth(): number {
    return GAME_WIDTH;
  }

  protected get worldHeight(): number {
    return GAME_HEIGHT;
  }

  protected configureCamera(): void {}

  protected addInteraction(target: InteractionTarget): void {
    this.interactions.add(target);
  }

  protected addCollider(x: number, y: number, width: number, height: number): void {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.colliders.add(zone);
  }

  protected addKeeper(x: number, y: number): Phaser.GameObjects.Image {
    const keeper = this.add.image(x, y, assetRegistry.resolve(this, TextureKey.Keeper0)).setDepth(25);
    this.addCharacterCollider(x, y + 9, 13, 8);
    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: keeper, y: y + 1, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    return keeper;
  }

  protected addSprout(x: number, y: number): Phaser.GameObjects.Image {
    const sprout = this.add.image(x, y, assetRegistry.resolve(this, TextureKey.Sprout0))
      .setDepth(24)
      .setTint(PALETTE.livingGreen);
    this.addCharacterCollider(x, y + 7, 12, 7);
    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: sprout, scaleY: 0.95, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    return sprout;
  }

  protected addMoth(x: number, y: number): Phaser.GameObjects.Image {
    const moth = this.add.image(x, y, assetRegistry.resolve(this, TextureKey.Moth0)).setDepth(24);
    this.addCharacterCollider(x, y + 7, 12, 7);
    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: moth, y: y + 3, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    return moth;
  }

  private addCharacterCollider(x: number, y: number, width: number, height: number): void {
    this.addCollider(x, y, width, height);
  }

  protected addPassage(
    x: number,
    y: number,
    stable: boolean,
    rotation = 0,
    alpha = 1,
  ): Phaser.GameObjects.Image {
    return this.add.image(
      x,
      y,
      assetRegistry.resolve(this, stable ? TextureKey.PassageStable : TextureKey.PassageUnstable),
    ).setRotation(rotation).setAlpha(alpha).setDepth(8);
  }

  protected async say(content: readonly DialoguePage[]): Promise<void> {
    await dialogueSystem.run(content, (locked) => this.dreamer.setInputLocked(locked));
  }

  protected async talkToRoomKeeper(
    introduction: readonly DialoguePage[],
    repeat: readonly DialoguePage[],
  ): Promise<void> {
    const first = !stateStore.snapshot.house.keeperRoomConversations.includes(this.roomId);
    await this.say(first ? introduction : repeat);
    if (first) {
      stateStore.markKeeperRoomConversation(this.roomId);
      this.checkpoint();
    }
  }

  protected async talkToHouseSprout(repeat: readonly DialoguePage[]): Promise<void> {
    const first = !stateStore.snapshot.house.sproutSpoken;
    await this.say(first ? houseDialogue.sproutArrival : repeat);
    if (first) {
      stateStore.markSproutSpoken();
      this.checkpoint();
    }
  }

  protected choose(
    content: readonly DialoguePage[],
    choices: readonly DialogueChoice[],
  ): Promise<string | undefined> {
    return dialogueSystem.run(content, (locked) => this.dreamer.setInputLocked(locked), choices);
  }

  protected conversation<T>(
    conduct: Parameters<typeof dialogueSystem.conversation<T>>[1],
  ): Promise<T> {
    return dialogueSystem.conversation((locked) => this.dreamer.setInputLocked(locked), conduct);
  }

  protected checkpoint(): void {
    stateStore.setSafePosition(this.dreamer);
    saveService.save(stateStore.snapshot);
  }

  protected async transitionTo(scene: SceneName, spawn: Position): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    this.dreamer.setInputLocked(true);
    this.checkpoint();
    this.cameras.main.fadeOut(240, 8, 5, 13);
    await this.wait(260);
    stateStore.setScene(scene, spawn);
    saveService.save(stateStore.snapshot);
    this.scene.start(scene, { spawn });
  }

  protected wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(milliseconds, resolve));
  }

  protected drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color = PALETTE.violetDark,
    alpha = 1,
  ): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(x, y, width, height, color, alpha).setDepth(2);
  }

  private async tryInteraction(): Promise<void> {
    const found = await this.interactions.tryInteract(this.dreamer, this.dreamer.facingDirection);
    if (!found) hud.showMessage(this.emptyMessage);
  }

  protected drawRoomShell(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink);
    g.fillRect(0, 0, 320, 180);
    g.fillStyle(PALETTE.violetDeep);
    g.fillRect(9, 9, 302, 162);
    g.fillStyle(PALETTE.violetDark, 0.34);
    g.fillRect(18, 24, 284, 136);
    g.lineStyle(1, PALETTE.paper, 0.055);
    for (let y = 32; y < 160; y += 12) g.lineBetween(18, y, 302, y);
    g.lineStyle(1, PALETTE.violet, 0.12);
    for (let x = 26; x < 302; x += 24) g.lineBetween(x, 24, x, 160);
    g.fillStyle(PALETTE.black, 0.72);
    g.fillRect(9, 9, 302, 15);
    g.fillRect(9, 160, 302, 11);
    g.fillRect(9, 9, 9, 162);
    g.fillRect(302, 9, 9, 162);
    g.fillStyle(PALETTE.violetLight, 0.12);
    g.fillRect(18, 24, 284, 3);
    g.lineStyle(1, PALETTE.paper, 0.1);
    g.strokeRect(9, 9, 302, 162);
  }

  private buildBoundaryCollision(): void {
    this.addCollider(this.worldWidth / 2, 5, this.worldWidth, 10);
    this.addCollider(this.worldWidth / 2, this.worldHeight - 5, this.worldWidth, 10);
    this.addCollider(5, this.worldHeight / 2, 10, this.worldHeight);
    this.addCollider(this.worldWidth - 5, this.worldHeight / 2, 10, this.worldHeight);
  }
}

export const HOUSE_SPAWNS = {
  [SceneId.HouseThreshold]: { left: { x: 42, y: 112 }, right: { x: 914, y: 112 } },
  [SceneId.HouseSittingRoom]: { left: { x: 34, y: 118 }, right: { x: 286, y: 118 }, top: { x: 160, y: 42 }, bottom: { x: 160, y: 148 } },
  [SceneId.HouseBedroom]: { left: { x: 34, y: 118 }, right: { x: 286, y: 118 }, top: { x: 160, y: 42 } },
  [SceneId.HouseHallway]: { left: { x: 34, y: 118 }, bottom: { x: 160, y: 148 }, top: { x: 160, y: 42 } },
  [SceneId.HouseKitchen]: { left: { x: 34, y: 118 } },
  [SceneId.HouseNursery]: { top: { x: 160, y: 42 } },
  [SceneId.HouseUnkeptRoom]: { bottom: { x: 160, y: 148 } },
} as const;
