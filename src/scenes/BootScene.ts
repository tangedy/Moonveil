import Phaser from 'phaser';
import type { AssetManifest } from '../assets/AssetRegistry';
import { PALETTE, SceneId } from '../game/config';
import { assetRegistry } from '../game/services';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneId.Boot);
  }

  preload(): void {
    this.load.json('asset-manifest', 'assets/manifest.json');
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
