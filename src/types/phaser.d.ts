import type { MoonveilState } from '../state/GameState';

declare global {
  interface Window {
    __MOONVEIL__?: {
      state: () => Readonly<MoonveilState>;
      scene: () => string;
      view: () => {
        player: { x: number; y: number; texture: string } | null;
        camera: { scrollX: number; scrollY: number } | null;
        reflection: { x: number; y: number; texture: string } | null;
      };
    };
  }
}

export {};
