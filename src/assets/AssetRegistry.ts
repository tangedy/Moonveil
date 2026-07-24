import type Phaser from 'phaser';
import { PALETTE, TextureKey, type TextureKey as LogicalTexture } from '../game/config';

export interface AssetManifest {
  images: Record<string, string>;
  audio: Record<string, string>;
}

function graphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 });
}

function finish(g: Phaser.GameObjects.Graphics, key: string, width: number, height: number): void {
  g.generateTexture(key, width, height);
  g.destroy();
}

export class AssetRegistry {
  generateFallbacks(scene: Phaser.Scene): void {
    this.generateDreamer(scene);
    this.generateChair(scene);
    this.generateFlowers(scene);
    this.generateMoth(scene);
    this.generateSprout(scene);
    this.generateStar(scene);
    this.generateArch(scene);
    this.generateKeeper(scene);
    this.generateHousePassages(scene);
    this.generateHousePortraits(scene);
    this.generateHousePhotographs(scene);
    this.generateHouseProps(scene);
  }

  resolve(scene: Phaser.Scene, key: LogicalTexture | string): string {
    const override = `override:${key}`;
    return scene.textures.exists(override) ? override : key;
  }

  queueOverrides(scene: Phaser.Scene, manifest: AssetManifest): number {
    let queued = 0;
    Object.entries(manifest.images ?? {}).forEach(([key, path]) => {
      scene.load.image(`override:${key}`, path);
      queued += 1;
    });
    Object.entries(manifest.audio ?? {}).forEach(([key, path]) => {
      scene.load.audio(`override-audio:${key}`, path);
      queued += 1;
    });
    return queued;
  }

  private generateDreamer(scene: Phaser.Scene): void {
    const frames: Array<{ key: string; bob: number; stride: boolean }> = [
      { key: TextureKey.DreamerStand, bob: 0, stride: false },
      { key: TextureKey.DreamerWalk0, bob: 0, stride: true },
      { key: TextureKey.DreamerWalk1, bob: 1, stride: true },
    ];

    frames.forEach(({ key, bob, stride }) => {
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);

      g.fillStyle(PALETTE.violetDark, 0.65);
      g.fillEllipse(8, 19, stride && bob === 1 ? 8 : 10, 2);

      g.fillStyle(PALETTE.black);
      if (!stride || bob === 0) {
        g.fillRect(4, 15 + bob, 3, 4);
        g.fillRect(9, 15 + bob, 3, 4);
      } else {
        g.fillRect(3, 16, 4, 3);
        g.fillRect(10, 15, 3, 4);
      }

      g.fillStyle(PALETTE.black);
      g.fillRoundedRect(3, 8 + bob, 10, 9, 2);
      g.fillStyle(PALETTE.paper);
      g.fillRoundedRect(4, 9 + bob, 8, 7, 1);
      g.fillStyle(PALETTE.violetLight, 0.55);
      g.fillRect(5, 14 + bob, 6, 1);

      g.fillStyle(PALETTE.black);
      g.fillCircle(8, 5 + bob, 5);
      g.fillStyle(PALETTE.paper);
      g.fillCircle(8, 6 + bob, 3);
      g.fillStyle(PALETTE.black);
      g.fillCircle(8, 4 + bob, 4);
      g.fillRect(4, 4 + bob, 8, 3);
      g.fillRect(5, 7 + bob, 3, 2);
      g.fillRect(9, 6 + bob, 2, 2);
      g.fillStyle(PALETTE.violetDark);
      g.fillRect(4, 4 + bob, 2, 3);

      g.fillStyle(PALETTE.paper);
      if (!stride || bob === 0) {
        g.fillRect(4, 18, 3, 1);
        g.fillRect(9, 18, 3, 1);
      } else {
        g.fillRect(3, 18, 4, 1);
        g.fillRect(10, 18, 3, 1);
      }
      finish(g, key, 16, 20);
    });
  }

  private generateChair(scene: Phaser.Scene): void {
    if (scene.textures.exists(TextureKey.Chair)) return;
    const g = graphics(scene);
    g.fillStyle(PALETTE.black);
    g.fillRoundedRect(3, 1, 14, 14, 2);
    g.fillRect(2, 12, 16, 5);
    g.fillRect(4, 16, 3, 7);
    g.fillRect(13, 16, 3, 7);
    g.fillStyle(PALETTE.paper);
    g.fillRoundedRect(5, 3, 10, 9, 1);
    g.fillStyle(PALETTE.violetLight, 0.75);
    g.fillRect(6, 4, 2, 7);
    g.fillRect(5, 13, 10, 2);
    g.fillStyle(PALETTE.paper);
    g.fillRect(5, 16, 2, 6);
    g.fillRect(13, 16, 2, 6);
    finish(g, TextureKey.Chair, 20, 24);
  }

  private generateFlowers(scene: Phaser.Scene): void {
    const makeFlower = (key: string, color: number): void => {
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      g.fillStyle(PALETTE.violetDark);
      g.fillRect(5, 8, 2, 8);
      g.fillRect(3, 11, 3, 2);
      g.fillStyle(color);
      g.fillCircle(6, 5, 2);
      g.fillCircle(3, 6, 2);
      g.fillCircle(9, 6, 2);
      g.fillCircle(4, 3, 2);
      g.fillCircle(8, 3, 2);
      g.fillStyle(PALETTE.ink);
      g.fillRect(5, 5, 2, 2);
      finish(g, key, 12, 16);
    };
    makeFlower(TextureKey.Flower, PALETTE.violetLight);
    makeFlower(TextureKey.FlowerWhite, PALETTE.paper);
  }

  private generateMoth(scene: Phaser.Scene): void {
    [0, 1].forEach((frame) => {
      const key = frame === 0 ? TextureKey.Moth0 : TextureKey.Moth1;
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      g.fillStyle(PALETTE.black);
      if (frame === 0) {
        g.fillTriangle(8, 9, 0, 2, 3, 15);
        g.fillTriangle(10, 9, 18, 2, 15, 15);
      } else {
        g.fillTriangle(8, 9, 3, 5, 5, 17);
        g.fillTriangle(10, 9, 15, 5, 13, 17);
      }
      g.fillStyle(PALETTE.violet, 0.9);
      if (frame === 0) {
        g.fillTriangle(7, 9, 2, 4, 4, 12);
        g.fillTriangle(11, 9, 16, 4, 14, 12);
      } else {
        g.fillTriangle(7, 9, 4, 7, 6, 14);
        g.fillTriangle(11, 9, 14, 7, 12, 14);
      }
      g.lineStyle(1, PALETTE.violetLight, 0.75);
      g.lineBetween(8, 9, frame === 0 ? 2 : 5, frame === 0 ? 7 : 9);
      g.lineBetween(10, 9, frame === 0 ? 16 : 13, frame === 0 ? 7 : 9);
      g.fillStyle(PALETTE.paper, 0.8);
      g.fillRect(8, 3, 2, 2);
      g.fillStyle(PALETTE.black);
      g.fillRoundedRect(8, 5, 2, 11, 1);
      g.lineStyle(1, PALETTE.violetLight, 0.65);
      g.lineBetween(8, 4, 5, 1);
      g.lineBetween(10, 4, 13, 1);
      finish(g, key, 18, 18);
    });
  }

  private generateSprout(scene: Phaser.Scene): void {
    [0, 1].forEach((frame) => {
      const key = frame === 0 ? TextureKey.Sprout0 : TextureKey.Sprout1;
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      const sway = frame === 0 ? 0 : 1;

      g.fillStyle(PALETTE.violetDark, 0.55);
      g.fillEllipse(9, 18, 13, 3);
      g.fillStyle(PALETTE.black);
      g.fillRect(8 + sway, 6, 3, 11);
      g.fillTriangle(9 + sway, 8, 1, 3 + sway, 5, 12);
      g.fillTriangle(10 + sway, 9, 17, 2, 14, 12 + sway);
      g.fillStyle(PALETTE.violet);
      g.fillTriangle(8 + sway, 8, 2, 4 + sway, 5, 10);
      g.fillTriangle(11 + sway, 9, 16, 3, 14, 10 + sway);
      g.fillStyle(PALETTE.violetLight);
      g.lineStyle(1, PALETTE.violetLight, 0.8);
      g.lineBetween(9 + sway, 8, 3, 6 + sway);
      g.lineBetween(10 + sway, 9, 15, 5);
      g.fillRect(9 + sway, 7, 1, 9);
      g.lineStyle(1, PALETTE.paper, 0.65);
      g.lineBetween(9 + sway, 16, 6, 19);
      g.lineBetween(10 + sway, 16, 13, 19);
      finish(g, key, 18, 20);
    });
  }

  private generateStar(scene: Phaser.Scene): void {
    [0, 1].forEach((frame) => {
      const key = frame === 0 ? TextureKey.Star0 : TextureKey.Star1;
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      g.fillStyle(PALETTE.violetLight, frame === 0 ? 0.25 : 0.4);
      g.fillCircle(10, 10, frame === 0 ? 9 : 10);
      g.fillStyle(PALETTE.paper);
      g.fillTriangle(10, 1, 12, 7, 18, 8);
      g.fillTriangle(18, 8, 13, 12, 15, 18);
      g.fillTriangle(15, 18, 10, 14, 5, 18);
      g.fillTriangle(5, 18, 7, 12, 2, 8);
      g.fillTriangle(2, 8, 8, 7, 10, 1);
      g.fillStyle(PALETTE.violetDark);
      g.fillRect(7, 9, 2, 1);
      g.fillRect(12, 9, 2, 1);
      finish(g, key, 20, 20);
    });
  }

  private generateArch(scene: Phaser.Scene): void {
    const makeArch = (key: string, open: boolean): void => {
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      g.fillStyle(PALETTE.black);
      g.fillRoundedRect(1, 1, 34, 35, 16);
      g.fillStyle(open ? PALETTE.paper : PALETTE.violetDark);
      g.fillRoundedRect(3, 3, 30, 33, 14);
      g.fillStyle(open ? PALETTE.violetLight : PALETTE.ink, open ? 0.8 : 1);
      g.fillRoundedRect(10, 10, 16, 26, 8);
      if (open) {
        g.fillStyle(PALETTE.paper, 0.7);
        g.fillCircle(18, 18, 3);
      }
      finish(g, key, 36, 36);
    };
    makeArch(TextureKey.ArchClosed, false);
    makeArch(TextureKey.ArchOpen, true);
  }

  private generateKeeper(scene: Phaser.Scene): void {
    [0, 1].forEach((frame) => {
      const key = frame === 0 ? TextureKey.Keeper0 : TextureKey.Keeper1;
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      const lean = frame === 0 ? 0 : 1;
      g.fillStyle(PALETTE.violetDark, 0.6);
      g.fillEllipse(10, 25, 16, 3);
      g.fillStyle(PALETTE.black);
      g.fillTriangle(4 + lean, 9, 16 + lean, 9, 18, 24);
      g.fillRoundedRect(5 + lean, 8, 11, 10, 2);
      g.fillCircle(10 + lean, 6, 5);
      g.fillStyle(PALETTE.paper);
      g.fillTriangle(7 + lean, 11, 13 + lean, 11, 10 + lean, 19);
      g.fillRect(8 + lean, 18, 4, 5);
      g.fillStyle(PALETTE.violetLight);
      g.fillRect(5 + lean, 14, 2, 7);
      g.fillRect(14 + lean, 14, 2, 7);
      g.fillStyle(PALETTE.black);
      g.fillRect(6 + lean, 3, 9, 6);
      g.fillRect(8 + lean, 8, 5, 2);
      g.lineStyle(1, PALETTE.paper, 0.75);
      g.lineBetween(6 + lean, 22, 5, 25);
      g.lineBetween(14 + lean, 22, 15, 25);
      g.lineStyle(1, PALETTE.violetLight, 0.8);
      g.strokeCircle(3 + lean, 18, 2);
      g.strokeCircle(17 + lean, 18, 2);
      finish(g, key, 21, 27);
    });
  }

  private generateHousePassages(scene: Phaser.Scene): void {
    const makePassage = (key: string, stable: boolean): void => {
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      g.fillStyle(PALETTE.black);
      g.fillRoundedRect(1, 1, 18, 29, 8);
      g.lineStyle(stable ? 2 : 1, stable ? PALETTE.paper : PALETTE.violet, stable ? 0.85 : 0.45);
      g.strokeRoundedRect(2, 2, 16, 28, 7);
      g.fillStyle(stable ? PALETTE.violetDark : PALETTE.ink, stable ? 0.72 : 0.9);
      g.fillRoundedRect(6, 7, 8, 23, 4);
      if (!stable) {
        g.lineStyle(1, PALETTE.violetLight, 0.35);
        g.lineBetween(3, 7, 17, 12);
        g.lineBetween(4, 19, 16, 16);
      } else {
        g.fillStyle(PALETTE.paper, 0.55);
        g.fillRect(9, 9, 2, 13);
      }
      finish(g, key, 20, 31);
    };
    makePassage(TextureKey.PassageUnstable, false);
    makePassage(TextureKey.PassageStable, true);
  }

  private generateHousePortraits(scene: Phaser.Scene): void {
    const makePortrait = (key: string, subject: 'woman' | 'chair' | 'dreamer'): void => {
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      g.fillStyle(PALETTE.black);
      g.fillRect(0, 0, 30, 42);
      g.fillStyle(PALETTE.violetDark);
      g.fillRect(2, 2, 26, 38);
      g.fillStyle(PALETTE.ink);
      g.fillRect(5, 5, 20, 32);
      g.lineStyle(1, PALETTE.paper, 0.4);
      g.strokeRect(3, 3, 24, 36);
      if (subject === 'woman') {
        g.fillStyle(PALETTE.paper, 0.72);
        g.fillCircle(15, 14, 5);
        g.fillTriangle(8, 34, 22, 34, 15, 17);
        g.fillStyle(PALETTE.black);
        g.fillRect(10, 9, 10, 7);
      } else if (subject === 'chair') {
        g.fillStyle(PALETTE.paper, 0.7);
        g.fillRect(9, 17, 12, 11);
        g.fillRect(8, 27, 14, 4);
        g.fillRect(10, 31, 3, 5);
        g.fillRect(18, 31, 3, 5);
      } else {
        g.fillStyle(PALETTE.paper, 0.78);
        g.fillCircle(15, 14, 4);
        g.fillRoundedRect(10, 18, 10, 13, 2);
        g.fillStyle(PALETTE.black);
        g.fillRect(10, 10, 10, 6);
      }
      finish(g, key, 30, 42);
    };
    makePortrait(TextureKey.PortraitWoman, 'woman');
    makePortrait(TextureKey.PortraitChair, 'chair');
    makePortrait(TextureKey.PortraitDreamer, 'dreamer');
  }

  private generateHousePhotographs(scene: Phaser.Scene): void {
    const makePhoto = (key: string, state: 'star' | 'empty' | 'shared' | 'still'): void => {
      if (scene.textures.exists(key)) return;
      const g = graphics(scene);
      g.fillStyle(PALETTE.paper);
      g.fillRect(0, 0, 28, 22);
      g.fillStyle(PALETTE.violetDeep);
      g.fillRect(2, 2, 24, 18);
      g.fillStyle(PALETTE.violetDark);
      g.fillRect(4, 11, 20, 7);
      g.fillStyle(PALETTE.black);
      g.fillTriangle(4, 11, 10, 5, 15, 11);
      g.fillTriangle(12, 11, 19, 4, 24, 11);
      if (state !== 'empty') {
        const alpha = state === 'still' ? 0.45 : 1;
        g.fillStyle(PALETTE.paper, alpha);
        g.fillCircle(state === 'shared' ? 18 : 20, 7, state === 'shared' ? 2 : 3);
      }
      if (state === 'shared') {
        g.fillStyle(PALETTE.violetLight, 0.8);
        g.fillCircle(8, 8, 2);
      }
      finish(g, key, 28, 22);
    };
    makePhoto(TextureKey.PhotographStar, 'star');
    makePhoto(TextureKey.PhotographEmpty, 'empty');
    makePhoto(TextureKey.PhotographShared, 'shared');
    makePhoto(TextureKey.PhotographStill, 'still');
  }

  private generateHouseProps(scene: Phaser.Scene): void {
    if (!scene.textures.exists(TextureKey.WoodenToy)) {
      const g = graphics(scene);
      g.fillStyle(PALETTE.paper, 0.72);
      g.fillRoundedRect(2, 2, 12, 6, 2);
      g.fillStyle(PALETTE.violetDark);
      g.fillCircle(5, 9, 3);
      g.fillCircle(12, 9, 3);
      g.fillStyle(PALETTE.black);
      g.fillCircle(5, 9, 1);
      g.fillCircle(12, 9, 1);
      finish(g, TextureKey.WoodenToy, 17, 12);
    }
    if (!scene.textures.exists(TextureKey.SproutLeaf)) {
      const g = graphics(scene);
      g.fillStyle(PALETTE.livingGreen);
      g.fillEllipse(6, 4, 11, 6);
      g.lineStyle(1, PALETTE.paper, 0.7);
      g.lineBetween(2, 6, 10, 2);
      finish(g, TextureKey.SproutLeaf, 12, 8);
    }
    if (!scene.textures.exists(TextureKey.HousePlant)) {
      const g = graphics(scene);
      g.fillStyle(PALETTE.livingGreen);
      g.fillRect(8, 8, 2, 15);
      g.fillEllipse(5, 13, 8, 5);
      g.fillEllipse(13, 10, 8, 5);
      g.fillStyle(PALETTE.paper);
      g.fillCircle(9, 6, 3);
      g.fillCircle(6, 7, 3);
      g.fillCircle(12, 7, 3);
      g.fillStyle(PALETTE.violetDeep);
      g.fillCircle(9, 7, 2);
      finish(g, TextureKey.HousePlant, 18, 24);
    }
  }
}
