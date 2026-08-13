import Phaser from 'phaser';
import { AudioCue, PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, dialogueOverlay, pauseMenuOverlay, saveService, stateStore } from '../game/services';
import { HOUSE_SPAWNS } from './HouseRoomScene';

export class SliceEndScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super(SceneId.SliceEnd);
  }

  create(): void {
    this.starting = false;
    if (!stateStore.snapshot.house.complete) {
      const spawn = HOUSE_SPAWNS[SceneId.HouseThreshold].left;
      stateStore.setScene(SceneId.HouseThreshold, spawn);
      saveService.save(stateStore.snapshot);
      this.scene.start(SceneId.HouseThreshold, { spawn });
      return;
    }

    this.input.enabled = true;
    pauseMenuOverlay.detach();
    void dialogueOverlay.hide(true);
    audioManager.attach(this);
    audioManager.stopAmbience();
    this.cameras.main.setBackgroundColor(PALETTE.ink);

    const emblem = this.add.image(160, 40, assetRegistry.resolve(this, TextureKey.HousePlant)).setScale(1.25).setAlpha(0);
    this.tweens.add({ targets: emblem, alpha: 1, duration: 1400, ease: 'Sine.inOut' });
    this.tweens.add({ targets: emblem, y: 44, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(160, 72, 'THE HOUSE HAS MADE ROOM.', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#fffaf2',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(160, 93, 'End of the current dream', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#8d5bc9',
    }).setOrigin(0.5);

    const beginButton = this.makeButton(160, 132, 'BEGIN AGAIN', () => this.begin(() => {
      stateStore.reset();
      saveService.save(stateStore.snapshot);
      this.scene.start(SceneId.Prologue);
    }));
    this.makeButton(160, 153, 'TITLE', () => this.begin(() => this.scene.start(SceneId.Launch)));

    this.input.keyboard?.once('keydown-ENTER', () => beginButton.emit('pointerdown'));
    this.input.keyboard?.once('keydown-SPACE', () => beginButton.emit('pointerdown'));
  }

  private makeButton(x: number, y: number, label: string, action: () => Promise<void>): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, `◇  ${label}`, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#c9a7f2',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setText(`◆  ${label}`).setColor('#fffaf2'));
    button.on('pointerout', () => button.setText(`◇  ${label}`).setColor('#c9a7f2'));
    button.on('pointerdown', () => void action());
    return button;
  }

  private async begin(action: () => void): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    await audioManager.unlock();
    this.input.enabled = false;
    audioManager.cue(AudioCue.MenuSelect);
    this.cameras.main.fadeOut(360, 255, 250, 242);
    await new Promise<void>((resolve) => this.time.delayedCall(380, resolve));
    audioManager.stopAmbience();
    action();
  }
}
