import Phaser from 'phaser';
import { houseDialogue } from '../content/houseWithoutDoors';
import { Dreamer } from '../entities/Dreamer';
import { PALETTE, SceneId, TextureKey, type SceneId as SceneName } from '../game/config';
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
    private readonly roomTitle: string,
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
    this.physics.world.setBounds(0, 0, 320, 180);
    this.cameras.main.setBounds(0, 0, 320, 180);
    this.cameras.main.setBackgroundColor(PALETTE.ink);
    audioManager.attach(this);
    audioManager.setMuted(stateStore.snapshot.preferences.muted);
    audioManager.startHouseAmbience();
    hud.show(true);
    hud.showHelp();

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

    inventoryOverlay.attach({
      canOpen: () => !dialogueOverlay.isVisible && !this.transitioning,
      onVisibilityChange: (open) => this.dreamer.setInputLocked(open),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => inventoryOverlay.detach());

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
    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: keeper, y: y + 1, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    return keeper;
  }

  protected addSprout(x: number, y: number): Phaser.GameObjects.Image {
    const sprout = this.add.image(x, y, assetRegistry.resolve(this, TextureKey.Sprout0))
      .setDepth(24)
      .setTint(PALETTE.livingGreen);
    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: sprout, scaleY: 0.95, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    return sprout;
  }

  protected addMoth(x: number, y: number): Phaser.GameObjects.Image {
    const moth = this.add.image(x, y, assetRegistry.resolve(this, TextureKey.Moth0)).setDepth(24);
    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: moth, y: y + 3, duration: 1050, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    return moth;
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

  protected addObjectCaption(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '5px',
      color: '#8d5bc9',
      letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0.72).setDepth(3);
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

  private drawRoomShell(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink);
    g.fillRect(0, 0, 320, 180);
    g.fillStyle(PALETTE.violetDeep);
    g.fillRect(9, 9, 302, 162);
    g.fillStyle(PALETTE.violetDark, 0.24);
    g.fillRect(14, 14, 292, 125);
    g.fillStyle(PALETTE.black, 0.55);
    g.fillRect(14, 139, 292, 27);
    g.lineStyle(1, PALETTE.violet, 0.16);
    for (let x = 17; x < 305; x += 17) g.lineBetween(x, 140, x + 8, 166);
    g.lineStyle(1, PALETTE.paper, 0.08);
    g.strokeRect(12, 12, 296, 156);

    this.add.text(18, 17, this.roomTitle, {
      fontFamily: 'monospace',
      fontSize: '5px',
      color: '#c9a7f2',
      letterSpacing: 1,
    }).setAlpha(0.5).setDepth(3);
  }

  private buildBoundaryCollision(): void {
    this.addCollider(160, 5, 320, 10);
    this.addCollider(160, 175, 320, 10);
    this.addCollider(5, 90, 10, 180);
    this.addCollider(315, 90, 10, 180);
  }
}

export const HOUSE_SPAWNS = {
  [SceneId.HouseThreshold]: { left: { x: 42, y: 112 }, right: { x: 274, y: 112 } },
  [SceneId.HouseSittingRoom]: { left: { x: 34, y: 118 }, right: { x: 286, y: 118 }, top: { x: 160, y: 42 }, bottom: { x: 160, y: 148 } },
  [SceneId.HouseBedroom]: { left: { x: 34, y: 118 }, right: { x: 286, y: 118 }, top: { x: 160, y: 42 } },
  [SceneId.HouseHallway]: { left: { x: 34, y: 118 }, bottom: { x: 160, y: 148 }, top: { x: 160, y: 42 } },
  [SceneId.HouseKitchen]: { left: { x: 34, y: 118 } },
  [SceneId.HouseNursery]: { top: { x: 160, y: 42 } },
  [SceneId.HouseUnkeptRoom]: { bottom: { x: 160, y: 148 } },
} as const;
