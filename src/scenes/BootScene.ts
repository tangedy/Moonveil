import Phaser from 'phaser';
import type { AssetManifest } from '../assets/AssetRegistry';
import menuThemeUrl from '../audio/music/as the moon gazes down upon your weary eyes - keys (128k).mp3';
import gardenThemeUrl from '../audio/music/time_in_limbo_KLICKAUD.mp3';
import houseThemeUrl from '../audio/music/clockwork_KLICKAUD.mp3';
import { AudioCue, PALETTE, SceneId } from '../game/config';
import { assetRegistry } from '../game/services';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneId.Boot);
  }

  preload(): void {
    this.load.json('asset-manifest', 'assets/manifest.json');
    this.load.audio(`override-audio:${AudioCue.Menu}`, menuThemeUrl);
    this.load.audio(`override-audio:${AudioCue.Garden}`, gardenThemeUrl);
    this.load.audio(`override-audio:${AudioCue.House}`, houseThemeUrl);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.ink);
    assetRegistry.generateFallbacks(this);
    const manifest = (this.cache.json.get('asset-manifest') ?? { images: {}, audio: {} }) as AssetManifest;
    const queued = assetRegistry.queueOverrides(this, manifest);
    if (queued === 0) {
      this.scene.start(SceneId.Launch);
      return;
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.scene.start(SceneId.Launch));
    this.load.start();
  }
}
