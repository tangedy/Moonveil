import Phaser from 'phaser';
import { PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, dialogueOverlay, hud, saveService, stateStore } from '../game/services';

export class SliceEndScene extends Phaser.Scene {
  constructor() {
    super(SceneId.SliceEnd);
  }

  create(): void {
    hud.show(false);
    hud.hideHelp();
    dialogueOverlay.hide();
    audioManager.attach(this);
    audioManager.stopAmbience();
    this.cameras.main.setBackgroundColor(PALETTE.ink);

    const star = this.add.image(160, 42, assetRegistry.resolve(this, TextureKey.Star0)).setScale(1.25).setAlpha(0);
    this.tweens.add({ targets: star, alpha: 1, duration: 1400, ease: 'Sine.inOut' });
    this.tweens.add({ targets: star, y: 46, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(160, 78, 'THE GARDEN REMEMBERS.', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#fffaf2',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(160, 101, 'End of the current dream', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#8d5bc9',
    }).setOrigin(0.5);

    this.makeButton(160, 132, 'BEGIN AGAIN', () => {
      stateStore.reset();
      saveService.save(stateStore.snapshot);
      this.scene.start(SceneId.Prologue);
    });
    this.makeButton(160, 153, 'TITLE', () => this.scene.start(SceneId.Launch));
  }

  private makeButton(x: number, y: number, label: string, action: () => void): void {
    const button = this.add.text(x, y, `◇  ${label}`, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#c9a7f2',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setText(`◆  ${label}`).setColor('#fffaf2'));
    button.on('pointerout', () => button.setText(`◇  ${label}`).setColor('#c9a7f2'));
    button.on('pointerdown', action);
  }
}
