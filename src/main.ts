import Phaser from 'phaser';
import './styles.css';
import { GAME_HEIGHT, GAME_WIDTH, PALETTE, SceneId } from './game/config';
import { stateStore } from './game/services';
import { BootScene } from './scenes/BootScene';
import { LaunchScene } from './scenes/LaunchScene';
import { PrologueScene } from './scenes/PrologueScene';
import { SliceEndScene } from './scenes/SliceEndScene';
import { VioletGardenScene } from './scenes/VioletGardenScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: PALETTE.ink,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
      fps: 120,
      fixedStep: true,
    },
  },
  input: {
    keyboard: true,
    mouse: true,
    touch: false,
  },
  scene: [BootScene, LaunchScene, PrologueScene, VioletGardenScene, SliceEndScene],
};

const game = new Phaser.Game(config);

window.setInterval(() => {
  if (!document.hidden && game.scene.getScenes(true).some((scene) => scene.scene.key !== SceneId.Launch)) {
    stateStore.addPlaytime(1);
  }
}, 1000);

if (import.meta.env.DEV) {
  window.__MOONVEIL__ = {
    state: () => stateStore.snapshot,
    scene: () => game.scene.getScenes(true)[0]?.scene.key ?? '',
    view: () => {
      const active = game.scene.getScenes(true)[0];
      const player = active?.children.getByName('dreamer') as Phaser.GameObjects.Sprite | null;
      const reflection = active?.children.getByName('pond-reflection') as Phaser.GameObjects.Image | null;
      return {
        player: player ? { x: player.x, y: player.y, texture: player.texture.key } : null,
        camera: active ? { scrollX: active.cameras.main.scrollX, scrollY: active.cameras.main.scrollY } : null,
        reflection: reflection ? { x: reflection.x, y: reflection.y, texture: reflection.texture.key } : null,
      };
    },
  };
}
