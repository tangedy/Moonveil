import Phaser from 'phaser';
import type { AssetRegistry } from '../assets/AssetRegistry';
import type { AudioManager } from '../audio/AudioManager';
import { AudioCue, Facing, MOVEMENT, TextureKey, type Facing as FacingDirection } from '../game/config';
import type { GameStateStore } from '../state/GameState';

interface MovementKeys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  Z: Phaser.Input.Keyboard.Key;
  ENTER: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
}

export class Dreamer extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: MovementKeys;
  private inputLocked = false;
  private walkTime = 0;
  private previousPosition = new Phaser.Math.Vector2();
  private facing: FacingDirection;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly store: GameStateStore,
    private readonly audio: AudioManager,
    private readonly assets: AssetRegistry,
    collideWorldBounds = true,
  ) {
    super(scene, x, y, assets.resolve(scene, TextureKey.DreamerStand));
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard input is required');
    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      Z: Phaser.Input.Keyboard.KeyCodes.Z,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as MovementKeys;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(MOVEMENT.bodyWidth, MOVEMENT.bodyHeight);
    body.setOffset(MOVEMENT.bodyOffsetX, MOVEMENT.bodyOffsetY);
    body.setCollideWorldBounds(collideWorldBounds);
    body.setMaxVelocity(MOVEMENT.speed, MOVEMENT.speed);

    this.setName('dreamer').setDepth(50);
    this.facing = store.snapshot.facing;
    this.previousPosition.set(x, y);
    this.applyTexture(false, 0);
  }

  update(delta: number): void {
    const moved = Phaser.Math.Distance.Between(this.previousPosition.x, this.previousPosition.y, this.x, this.y);
    if (moved > 0.01 && moved < MOVEMENT.sprintSpeed * 0.15) {
      const gained = this.store.addTravelDistance(moved);
      if (gained > 0) this.audio.cue(AudioCue.Step);
    }
    this.previousPosition.set(this.x, this.y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.inputLocked) {
      body.setVelocity(0, 0);
      this.applyTexture(false, 0);
      return;
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    const sprinting = this.cursors.shift?.isDown ?? false;
    const speed = sprinting ? MOVEMENT.sprintSpeed : MOVEMENT.speed;
    const velocity = new Phaser.Math.Vector2(Number(right) - Number(left), Number(down) - Number(up));
    const walking = velocity.lengthSq() > 0;

    body.setMaxVelocity(speed, speed);

    if (walking) {
      velocity.normalize().scale(speed);
      body.setVelocity(velocity.x, velocity.y);
      this.updateFacing(left, right, up, down);
      this.walkTime += delta * (sprinting ? 1.45 : 1);
    } else {
      body.setVelocity(0, 0);
      this.walkTime = 0;
    }

    this.applyTexture(walking, Math.floor(this.walkTime / 145) % 2);
  }

  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
    if (locked) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.applyTexture(false, 0);
    }
  }

  get isInputLocked(): boolean {
    return this.inputLocked;
  }

  get facingDirection(): FacingDirection {
    return this.facing;
  }

  consumeInteract(): boolean {
    if (this.inputLocked) return false;
    return (
      Phaser.Input.Keyboard.JustDown(this.keys.Z) ||
      Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    );
  }

  teleport(x: number, y: number, preserveVelocity = false): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const velocityX = body.velocity.x;
    const velocityY = body.velocity.y;
    this.setPosition(x, y);
    body.reset(x, y);
    if (preserveVelocity) body.setVelocity(velocityX, velocityY);
    this.previousPosition.set(x, y);
  }

  private updateFacing(left: boolean, right: boolean, up: boolean, down: boolean): void {
    const horizontalPressedAt = Math.max(left ? this.latestTime(this.cursors.left, this.keys.A) : 0, right ? this.latestTime(this.cursors.right, this.keys.D) : 0);
    const verticalPressedAt = Math.max(up ? this.latestTime(this.cursors.up, this.keys.W) : 0, down ? this.latestTime(this.cursors.down, this.keys.S) : 0);

    if ((left || right) && horizontalPressedAt >= verticalPressedAt) this.facing = left ? Facing.Left : Facing.Right;
    else if (up || down) this.facing = up ? Facing.Up : Facing.Down;
    this.store.setFacing(this.facing);
  }

  private latestTime(primary: Phaser.Input.Keyboard.Key, secondary: Phaser.Input.Keyboard.Key): number {
    return Math.max(primary.timeDown, secondary.timeDown);
  }

  private applyTexture(walking: boolean, frame: number): void {
    const key = walking
      ? frame === 0
        ? TextureKey.DreamerWalk0
        : TextureKey.DreamerWalk1
      : TextureKey.DreamerStand;
    const resolved = this.assets.resolve(this.scene, key);
    if (this.texture.key !== resolved) this.setTexture(resolved);
    this.setFlipX(this.facing === Facing.Left);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const width = this.frame.width;
    const height = this.frame.height;
    body.setSize(MOVEMENT.bodyWidth, MOVEMENT.bodyHeight);
    body.setOffset((width - MOVEMENT.bodyWidth) / 2, height - MOVEMENT.bodyHeight - 2);
  }
}
