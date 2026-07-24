import Phaser from 'phaser';
import { PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, dialogueOverlay, hud, inventoryOverlay, saveService, stateStore } from '../game/services';
import { HOUSE_SPAWNS } from './HouseRoomScene';

export class SliceEndScene extends Phaser.Scene {
  constructor() {
    super(SceneId.SliceEnd);
  }

  create(): void {
    hud.show(false);
    hud.hideHelp();
    inventoryOverlay.detach();
    void dialogueOverlay.hide(true);
    audioManager.attach(this);
    audioManager.stopAmbience();
    this.cameras.main.setBackgroundColor(PALETTE.ink);

    const complete = stateStore.snapshot.house.complete;
    const emblemKey = complete ? TextureKey.HousePlant : TextureKey.Star0;
    const emblem = this.add.image(160, 40, assetRegistry.resolve(this, emblemKey)).setScale(1.25).setAlpha(0);
    this.tweens.add({ targets: emblem, alpha: 1, duration: 1400, ease: 'Sine.inOut' });
    this.tweens.add({ targets: emblem, y: 44, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.add.text(160, 72, complete ? 'THE HOUSE HAS MADE ROOM.' : 'THE GARDEN REMEMBERS.', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#fffaf2',
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.add.text(160, 93, complete ? 'End of the current dream' : 'A house is waiting without doors', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#8d5bc9',
    }).setOrigin(0.5);

    const continueButton = complete ? null : this.makeButton(160, 117, 'CONTINUE', () => {
      const spawn = HOUSE_SPAWNS[SceneId.HouseThreshold].left;
      stateStore.setScene(SceneId.HouseThreshold, spawn);
      saveService.save(stateStore.snapshot);
      this.scene.start(SceneId.HouseThreshold, { spawn });
    });
    const beginButton = this.makeButton(160, complete ? 132 : 140, 'BEGIN AGAIN', () => {
      stateStore.reset();
      saveService.save(stateStore.snapshot);
      this.scene.start(SceneId.Prologue);
    });
    this.makeButton(160, complete ? 153 : 160, 'TITLE', () => this.scene.start(SceneId.Launch));

    const preferred = continueButton ?? beginButton;
    this.input.keyboard?.once('keydown-ENTER', () => preferred.emit('pointerdown'));
    this.input.keyboard?.once('keydown-SPACE', () => preferred.emit('pointerdown'));
  }

  private makeButton(x: number, y: number, label: string, action: () => void): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, `◇  ${label}`, {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#c9a7f2',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setText(`◆  ${label}`).setColor('#fffaf2'));
    button.on('pointerout', () => button.setText(`◇  ${label}`).setColor('#c9a7f2'));
    button.on('pointerdown', action);
    return button;
  }
}
