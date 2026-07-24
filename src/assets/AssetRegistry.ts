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
    const directions = ['down', 'up', 'left', 'right'] as const;
    directions.forEach((direction) => {
      [0, 1].forEach((frame) => {
        const key = `dreamer-${direction}-${frame}`;
        if (scene.textures.exists(key)) return;
        const g = graphics(scene);
        const bob = frame === 0 ? 0 : 1;

        g.fillStyle(PALETTE.violetDark, 0.65);
        g.fillEllipse(8, 19, frame === 0 ? 10 : 8, 2);

        g.fillStyle(PALETTE.black);
        if (frame === 0) {
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
        if (direction === 'left') g.fillRect(4, 10 + bob, 2, 5);
        else if (direction === 'right') g.fillRect(10, 10 + bob, 2, 5);
        else g.fillRect(5, 14 + bob, 6, 1);

        g.fillStyle(PALETTE.black);
        g.fillCircle(8, 5 + bob, 5);
        g.fillStyle(PALETTE.paper);
        g.fillCircle(8, 6 + bob, 3);
        g.fillStyle(PALETTE.black);
        g.fillCircle(8, 4 + bob, 4);

        if (direction === 'down') {
          g.fillRect(4, 4 + bob, 8, 3);
          g.fillRect(5, 7 + bob, 3, 2);
          g.fillRect(9, 6 + bob, 2, 2);
          g.fillStyle(PALETTE.violetDark);
          g.fillRect(4, 4 + bob, 2, 3);
        } else if (direction === 'up') {
          g.fillCircle(8, 6 + bob, 4);
          g.fillStyle(PALETTE.violetDark);
          g.fillRect(5, 3 + bob, 2, 3);
        } else if (direction === 'left') {
          g.fillRect(3, 4 + bob, 7, 5);
          g.fillRect(9, 3 + bob, 2, 3);
          g.fillStyle(PALETTE.violetDark);
          g.fillRect(3, 5 + bob, 2, 3);
        } else if (direction === 'right') {
          g.fillRect(6, 4 + bob, 7, 5);
          g.fillRect(5, 3 + bob, 2, 3);
          g.fillStyle(PALETTE.violetDark);
          g.fillRect(11, 5 + bob, 2, 3);
        }

        g.fillStyle(PALETTE.paper);
        if (frame === 0) {
          g.fillRect(4, 18, 3, 1);
          g.fillRect(9, 18, 3, 1);
        } else {
          g.fillRect(3, 18, 4, 1);
          g.fillRect(10, 18, 3, 1);
        }
        finish(g, key, 16, 20);
      });
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
}
