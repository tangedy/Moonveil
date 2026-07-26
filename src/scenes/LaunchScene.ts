import Phaser from 'phaser';
import { AudioCue, PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, dialogueOverlay, hud, inventoryOverlay, saveService, stateStore } from '../game/services';

export class LaunchScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super(SceneId.Launch);
  }

  create(): void {
    this.starting = false;
    this.input.enabled = true;
    hud.show(false);
    hud.hideHelp();
    inventoryOverlay.detach();
    void dialogueOverlay.hide(true);
    audioManager.attach(this);
    audioManager.stopAmbience();
    const savedPreferences = saveService.load()?.preferences;
    if (savedPreferences) audioManager.setMuted(savedPreferences.muted);
    void this.ensureMenuMusic();
    this.input.once('pointerdown', () => void this.ensureMenuMusic());
    this.input.keyboard?.once('keydown', () => void this.ensureMenuMusic());
    this.cameras.main.setBackgroundColor(PALETTE.ink);

    const motes = this.add.group();
    for (let index = 0; index < 18; index += 1) {
      const mote = this.add.circle(
        Phaser.Math.Between(14, 306),
        Phaser.Math.Between(10, 170),
        Phaser.Math.Between(1, 2),
        index % 4 === 0 ? PALETTE.paper : PALETTE.violet,
        Phaser.Math.FloatBetween(0.12, 0.42),
      );
      motes.add(mote);
      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(5, 18),
        alpha: { from: mote.alpha, to: 0.04 },
        duration: Phaser.Math.Between(1700, 3600),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    }

    const flower = this.add.image(160, 45, assetRegistry.resolve(this, TextureKey.Flower)).setScale(1.5);
    this.tweens.add({ targets: flower, angle: { from: -3, to: 3 }, duration: 1800, yoyo: true, repeat: -1 });

    this.add.text(160, 75, 'M O O N V E I L', {
      fontFamily: 'Georgia, serif',
      fontSize: '21px',
      color: '#fffaf2',
      letterSpacing: 4,
    }).setOrigin(0.5);
    this.add.text(160, 93, 'a small dream', {
      fontFamily: 'monospace',
      fontSize: '6px',
      color: '#8d5bc9',
      letterSpacing: 1,
    }).setOrigin(0.5);

    const savedState = saveService.load();
    const continueButton = savedState ? this.makeButton(160, 121, 'CONTINUE', async () => {
      await this.begin(async () => {
        stateStore.replace(savedState);
        audioManager.setMuted(savedState.preferences.muted);
        this.scene.start(savedState.currentScene);
      });
    }) : null;

    const newY = savedState ? 145 : 127;
    const newButton = this.makeButton(160, newY, savedState ? 'NEW DREAM' : 'BEGIN', async () => {
      await this.begin(async () => {
        stateStore.reset();
        saveService.save(stateStore.snapshot);
        this.scene.start(SceneId.Prologue);
      });
    });

    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ENTER', () => (continueButton ?? newButton).emit('pointerdown'));
    keyboard?.once('keydown-SPACE', () => (continueButton ?? newButton).emit('pointerdown'));
  }

  private makeButton(x: number, y: number, label: string, action: () => Promise<void>): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, `◇  ${label}`, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#c9a7f2',
      backgroundColor: '#08050d',
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setText(`◆  ${label}`).setColor('#fffaf2'));
    button.on('pointerout', () => button.setText(`◇  ${label}`).setColor('#c9a7f2'));
    button.on('pointerdown', () => void action());
    return button;
  }

  private async ensureMenuMusic(): Promise<void> {
    await audioManager.unlock();
    audioManager.startMenuMusic();
  }

  private async begin(action: () => Promise<void> | void): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    await this.ensureMenuMusic();
    this.input.enabled = false;
    audioManager.cue(AudioCue.MenuSelect);
    this.cameras.main.fadeOut(360, 255, 250, 242);
    await new Promise<void>((resolve) => this.time.delayedCall(380, resolve));
    audioManager.stopAmbience();
    await action();
  }
}
