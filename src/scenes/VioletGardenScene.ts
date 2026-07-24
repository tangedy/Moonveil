import Phaser from 'phaser';
import { gardenDialogue } from '../content/violetGarden';
import { Dreamer } from '../entities/Dreamer';
import { AudioCue, PALETTE, SceneId, TextureKey } from '../game/config';
import {
  assetRegistry,
  audioManager,
  dialogueOverlay,
  dialogueSystem,
  hud,
  inventoryOverlay,
  saveService,
  stateStore,
} from '../game/services';
import { InteractionSystem } from '../systems/InteractionSystem';
import { projectInsideEllipse, reflectionFeetRotation } from '../systems/PondReflection';

const POND = { centerX: 350, centerY: 218, radiusX: 67, radiusY: 37 } as const;
const REFLECTION_SCALE_X = 0.82;
const REFLECTION_SCALE_Y = 0.62;

interface FlowerRecord {
  image: Phaser.GameObjects.Image;
  x: number;
  y: number;
  changed: boolean;
}

export class VioletGardenScene extends Phaser.Scene {
  private dreamer!: Dreamer;
  private readonly interactions = new InteractionSystem();
  private colliders!: Phaser.Physics.Arcade.StaticGroup;
  private flowers: FlowerRecord[] = [];
  private moth!: Phaser.GameObjects.Image;
  private sprout!: Phaser.GameObjects.Image;
  private star!: Phaser.GameObjects.Image;
  private arch!: Phaser.GameObjects.Image;
  private reflection!: Phaser.GameObjects.Image;
  private reflectionMaskShape!: Phaser.GameObjects.Graphics;
  private reflectionBlinking = false;
  private transitioning = false;

  constructor() {
    super(SceneId.VioletGarden);
  }

  create(): void {
    this.transitioning = false;
    this.interactions.clear();
    this.flowers = [];
    this.physics.world.setBounds(0, 0, 640, 360);
    this.cameras.main.setBounds(0, 0, 640, 360);
    this.cameras.main.setBackgroundColor(PALETTE.violetDeep);
    audioManager.attach(this);
    audioManager.setMuted(stateStore.snapshot.preferences.muted);
    audioManager.startGardenAmbience();
    hud.show(true);
    hud.showHelp();

    this.drawGarden();
    this.colliders = this.physics.add.staticGroup();
    this.buildCollision();
    this.createEnvironment();

    const start = stateStore.snapshot.lastSafe.scene === SceneId.VioletGarden
      ? stateStore.snapshot.lastSafe.position
      : { x: 54, y: 302 };
    this.dreamer = new Dreamer(this, start.x, start.y, stateStore, audioManager, assetRegistry, true);
    this.physics.add.collider(this.dreamer, this.colliders);
    this.cameras.main.startFollow(this.dreamer, true, 0.09, 0.09);
    this.cameras.main.setRoundPixels(true);
    inventoryOverlay.attach({
      canOpen: () => !dialogueOverlay.isVisible && !this.transitioning,
      onVisibilityChange: (open) => this.dreamer.setInputLocked(open),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => inventoryOverlay.detach());

    this.registerInteractions();
    this.syncConsequenceState();
    if (!stateStore.snapshot.garden.starTaken) audioManager.startStarHum();
    this.cameras.main.fadeIn(500, 255, 250, 242);
  }

  update(_time: number, delta: number): void {
    if (!this.dreamer || this.transitioning) return;
    this.dreamer.update(delta);

    if (this.dreamer.consumeInteract()) {
      void this.tryInteraction();
    }

    this.updateFlowers();
    this.updateReflection();

    if (!stateStore.snapshot.garden.starTaken) {
      audioManager.setStarDistance(Phaser.Math.Distance.Between(this.dreamer.x, this.dreamer.y, this.star.x, this.star.y));
    }

    if (
      stateStore.snapshot.garden.archUnlocked &&
      Phaser.Math.Distance.Between(this.dreamer.x, this.dreamer.y, this.arch.x, this.arch.y + 12) < 16
    ) {
      void this.finishSlice();
    }
  }

  private drawGarden(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.violetDeep);
    g.fillRect(0, 0, 640, 360);
    g.fillStyle(PALETTE.violetDark);
    g.fillRoundedRect(18, 18, 604, 324, 18);

    g.fillStyle(PALETTE.violet, 0.32);
    g.fillRoundedRect(31, 38, 578, 282, 28);
    g.fillStyle(PALETTE.paper, 0.11);
    g.fillRoundedRect(32, 281, 560, 34, 15);
    g.fillRoundedRect(52, 112, 38, 190, 15);
    g.fillRoundedRect(70, 103, 500, 30, 15);
    g.fillRoundedRect(535, 47, 38, 75, 15);

    g.lineStyle(1, PALETTE.violetLight, 0.18);
    for (let x = 38; x < 612; x += 18) {
      for (let y = 36; y < 330; y += 17) {
        if ((x + y) % 5 === 0) g.strokeCircle(x, y, 2);
        else g.lineBetween(x, y, x + 2, y - 3);
      }
    }

    g.fillStyle(PALETTE.violet, 0.86);
    g.fillEllipse(350, 218, 142, 82);
    g.lineStyle(2, PALETTE.violetLight, 0.55);
    g.strokeEllipse(350, 218, 142, 82);
    g.lineStyle(1, PALETTE.paper, 0.16);
    g.strokeEllipse(350, 217, 105, 46);

    g.fillStyle(PALETTE.violetDeep, 0.8);
    for (let x = 465; x < 548; x += 8) {
      for (let y = 238; y < 305; y += 9) {
        g.fillTriangle(x, y + 7, x + 3, y, x + 6, y + 7);
      }
    }

    g.fillStyle(PALETTE.ink, 0.72);
    for (let x = 12; x < 640; x += 16) {
      g.fillCircle(x, 15 + (x % 3), 12);
      g.fillCircle(x, 345 - (x % 4), 12);
    }
    for (let y = 22; y < 350; y += 16) {
      g.fillCircle(10 + (y % 3), y, 12);
      g.fillCircle(630 - (y % 4), y, 12);
    }
  }

  private buildCollision(): void {
    this.addStaticCollider(320, 8, 640, 16);
    this.addStaticCollider(320, 352, 640, 16);
    this.addStaticCollider(8, 180, 16, 360);
    this.addStaticCollider(632, 180, 16, 360);
    this.addStaticCollider(350, 218, 126, 62);
    this.addStaticCollider(589, 68, 24, 100);
    this.addStaticCollider(542, 68, 18, 44);
  }

  private addStaticCollider(x: number, y: number, width: number, height: number): void {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.colliders.add(zone);
  }

  private createEnvironment(): void {
    this.reflectionMaskShape = this.add.graphics();
    this.reflectionMaskShape.fillStyle(PALETTE.paper);
    this.reflectionMaskShape.fillEllipse(POND.centerX, POND.centerY, POND.radiusX * 2, POND.radiusY * 2);
    this.reflectionMaskShape.setVisible(false);
    this.reflection = this.add.image(
      POND.centerX,
      POND.centerY,
      assetRegistry.resolve(this, TextureKey.DreamerStand),
    )
      .setDepth(4)
      .setAlpha(0.52)
      .setScale(REFLECTION_SCALE_X, REFLECTION_SCALE_Y)
      .setTint(PALETTE.violetLight)
      .setName('pond-reflection');
    this.reflection.setMask(this.reflectionMaskShape.createGeometryMask());

    const flowerPositions = [
      [128, 164], [174, 78], [222, 176], [441, 143], [418, 296], [284, 73], [540, 181], [102, 242],
      [584, 260], [205, 299], [478, 91], [310, 306],
    ] as const;
    flowerPositions.forEach(([x, y], index) => {
      const changed = index === 3;
      const useWhite = changed && stateStore.snapshot.garden.whiteFlower;
      const image = this.add.image(x, y, assetRegistry.resolve(this, useWhite ? TextureKey.FlowerWhite : TextureKey.Flower)).setDepth(7);
      this.flowers.push({ image, x, y, changed });
    });

    this.moth = this.add.image(112, 267, assetRegistry.resolve(this, TextureKey.Moth0)).setDepth(15);
    this.sprout = this.add.image(256, 112, assetRegistry.resolve(this, TextureKey.Sprout0)).setDepth(15);
    this.star = this.add.image(507, 268, assetRegistry.resolve(this, TextureKey.Star0)).setDepth(13);
    this.arch = this.add.image(
      566,
      49,
      assetRegistry.resolve(this, stateStore.snapshot.garden.archUnlocked ? TextureKey.ArchOpen : TextureKey.ArchClosed),
    ).setDepth(12);

    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: this.moth, y: '+=3', duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: this.sprout, scaleY: 0.94, duration: 1250, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: this.star, scale: 1.14, alpha: 0.82, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private registerInteractions(): void {
    this.interactions.add({ id: 'garden-moth', kind: 'npc', x: 112, y: 267, radius: 10, interact: () => this.talkToMoth() });
    this.interactions.add({ id: 'garden-sprout', kind: 'npc', x: 256, y: 112, radius: 10, interact: () => this.talkToSprout() });
    this.interactions.add({ id: 'garden-pond', kind: 'object', x: 350, y: 218, radius: 70, interact: () => this.inspectPond() });
    this.interactions.add({
      id: 'garden-star',
      kind: 'object',
      x: 507,
      y: 268,
      radius: 11,
      enabled: () => !stateStore.snapshot.garden.starTaken,
      interact: () => this.inspectStar(),
    });
    this.interactions.add({ id: 'garden-arch', kind: 'object', x: 566, y: 57, radius: 19, interact: () => this.inspectArch() });
    this.flowers.forEach((flower, index) => {
      this.interactions.add({
        id: `garden-flower-${index}`,
        kind: 'object',
        x: flower.x,
        y: flower.y,
        radius: 7,
        interact: () => this.inspectFlower(flower),
      });
    });
  }

  private async tryInteraction(): Promise<void> {
    const found = await this.interactions.tryInteract(this.dreamer, this.dreamer.facingDirection);
    if (!found) hud.showMessage('Only the grass answers.');
  }

  private async talkToMoth(): Promise<void> {
    const garden = stateStore.snapshot.garden;
    if (garden.starTaken) {
      const index = Math.min(garden.mothAfterStarStep, gardenDialogue.mothAfterStar.length - 1);
      await this.say(gardenDialogue.mothAfterStar[index]!);
      stateStore.advanceGardenMothAfterStar();
    } else if (garden.mothBeforeStarStep > 0 && garden.pondExamined && !garden.mothPondResponseHeard) {
      await this.say(gardenDialogue.mothAfterPond);
      stateStore.markGardenMothPondResponse();
    } else {
      const index = Math.min(garden.mothBeforeStarStep, gardenDialogue.mothBeforeStar.length - 1);
      await this.say(gardenDialogue.mothBeforeStar[index]!);
      stateStore.advanceGardenMothBeforeStar();
    }
    this.checkpoint();
  }

  private async talkToSprout(): Promise<void> {
    const garden = stateStore.snapshot.garden;
    const pages =
      garden.starTaken && garden.sproutSpoken
        ? gardenDialogue.sproutAfter
        : garden.sproutSpoken
          ? gardenDialogue.sproutRepeat
          : gardenDialogue.sproutBefore;
    await this.say(pages);
    stateStore.markGardenInteraction('sprout');
    this.checkpoint();
  }

  private async inspectPond(): Promise<void> {
    const first = !stateStore.snapshot.garden.pondExamined;
    this.blinkReflection();
    await this.say(first ? gardenDialogue.pondFirst : gardenDialogue.pondRepeat);
    stateStore.markGardenInteraction('pond');
    this.checkpoint();
  }

  private async inspectFlower(flower: FlowerRecord): Promise<void> {
    await this.say(flower.changed && stateStore.snapshot.garden.whiteFlower ? gardenDialogue.whiteFlower : gardenDialogue.flower);
  }

  private async inspectStar(): Promise<void> {
    if (stateStore.snapshot.garden.starTaken || this.transitioning) return;
    stateStore.markGardenInteraction('star-discovered');
    await dialogueSystem.run(gardenDialogue.star, (locked) => this.dreamer.setInputLocked(locked));
    await this.resolveStarConsequence();
  }

  private async resolveStarConsequence(): Promise<void> {
    this.transitioning = true;
    this.dreamer.setInputLocked(true);
    this.star.setVisible(false);
    audioManager.stopStarHum();
    audioManager.cue(AudioCue.StarTake);

    const nightmare = this.createNightmareOverlay();
    this.tweens.add({ targets: nightmare, alpha: 1, duration: 180, ease: 'Stepped' });
    await this.wait(stateStore.snapshot.preferences.reducedMotion ? 220 : 780);
    this.tweens.add({ targets: nightmare, alpha: 0, duration: 260 });
    await this.wait(280);
    nightmare.destroy(true);

    stateStore.resolveVioletStar();
    this.syncConsequenceState();
    this.checkpoint();
    this.transitioning = false;
    this.dreamer.setInputLocked(false);
    await this.say(gardenDialogue.starTaken);
  }

  private createNightmareOverlay(): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.black, 1);
    g.fillRect(0, 0, 320, 180);
    g.lineStyle(1, PALETTE.paper, 0.8);
    g.strokeEllipse(175, 110, 82, 42);
    for (let x = 24; x < 310; x += 19) {
      const height = 6 + (x % 13);
      g.lineBetween(x, 156, x - 2, 156 - height);
      g.lineBetween(x - 2, 156 - height, x + 2, 150 - height);
    }
    g.fillStyle(PALETTE.paper);
    g.fillCircle(160, 92, 4);
    g.setScrollFactor(0);
    const container = this.add.container(0, 0, [g]).setDepth(1000).setScrollFactor(0).setAlpha(0);
    return container;
  }

  private async inspectArch(): Promise<void> {
    await this.say(stateStore.snapshot.garden.archUnlocked ? gardenDialogue.archOpen : gardenDialogue.archClosed);
  }

  private syncConsequenceState(): void {
    const garden = stateStore.snapshot.garden;
    this.star.setVisible(!garden.starTaken);
    const changed = this.flowers.find((flower) => flower.changed);
    if (changed) changed.image.setTexture(assetRegistry.resolve(this, garden.whiteFlower ? TextureKey.FlowerWhite : TextureKey.Flower));
    this.arch.setTexture(assetRegistry.resolve(this, garden.archUnlocked ? TextureKey.ArchOpen : TextureKey.ArchClosed));
    if (garden.archUnlocked && !stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: this.arch, alpha: 0.72, duration: 780, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private updateFlowers(): void {
    if (stateStore.snapshot.preferences.reducedMotion) return;
    this.flowers.forEach((flower) => {
      const dx = this.dreamer.x - flower.x;
      const desired = Phaser.Math.Clamp(dx / 160, -0.22, 0.22);
      flower.image.rotation = Phaser.Math.Linear(flower.image.rotation, desired, 0.045);
    });
  }

  private updateReflection(): void {
    const projected = projectInsideEllipse(this.dreamer, POND);
    this.reflection.x = Phaser.Math.Linear(this.reflection.x, projected.x, 0.12);
    this.reflection.y = Phaser.Math.Linear(this.reflection.y, projected.y, 0.12);

    if (this.reflection.texture.key !== this.dreamer.texture.key) {
      this.reflection.setTexture(this.dreamer.texture.key);
    }
    this.reflection.setFlipX(this.dreamer.flipX);

    const targetRotation = reflectionFeetRotation(this.reflection, this.dreamer);
    this.reflection.rotation = Phaser.Math.Angle.RotateTo(this.reflection.rotation, targetRotation, 0.18);

    if (!this.reflectionBlinking) {
      const distance = Phaser.Math.Distance.Between(
        this.dreamer.x,
        this.dreamer.y,
        POND.centerX,
        POND.centerY,
      );
      const alpha = Phaser.Math.Clamp(0.6 - Math.max(0, distance - 72) / 260, 0.16, 0.56);
      this.reflection.setAlpha(Phaser.Math.Linear(this.reflection.alpha, alpha, 0.1));
    }
  }

  private blinkReflection(): void {
    this.reflectionBlinking = true;
    if (stateStore.snapshot.preferences.reducedMotion) {
      this.reflection.setAlpha(0.15);
      this.time.delayedCall(160, () => {
        this.reflection.setAlpha(0.52);
        this.reflectionBlinking = false;
      });
      return;
    }
    this.reflection.setScale(REFLECTION_SCALE_X, 0.05);
    this.time.delayedCall(190, () => {
      this.reflection.setScale(REFLECTION_SCALE_X, REFLECTION_SCALE_Y);
      this.reflectionBlinking = false;
    });
  }

  private async finishSlice(): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    this.dreamer.setInputLocked(true);
    await this.say(gardenDialogue.archOpen);
    this.dreamer.setInputLocked(true);
    stateStore.completeSlice();
    saveService.save(stateStore.snapshot);
    audioManager.stopAmbience();
    this.cameras.main.fadeOut(900, 255, 250, 242);
    await this.wait(920);
    this.scene.start(SceneId.SliceEnd);
  }

  private say(pages: readonly { speaker?: string; text: string }[]): Promise<string | undefined> {
    return dialogueSystem.run(pages, (locked) => this.dreamer.setInputLocked(locked));
  }

  private checkpoint(): void {
    stateStore.setSafePosition(this.dreamer);
    saveService.save(stateStore.snapshot);
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(milliseconds, resolve));
  }
}
