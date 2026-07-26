import Phaser from 'phaser';

interface CameraIntroOptions {
  scene: Phaser.Scene;
  camera: Phaser.Cameras.Scene2D.Camera;
  target: Phaser.GameObjects.GameObject & { x: number; y: number };
  worldX?: number;
  worldY?: number;
  worldWidth: number;
  worldHeight: number;
  reducedMotion: boolean;
  onComplete: () => void;
}

const HOLD_DURATION = 480;
const PAN_DURATION = 1250;
const FADE_DURATION = 420;
const REDUCED_FADE_DURATION = 180;

export function playCameraIntro({
  scene,
  camera,
  target,
  worldX = 0,
  worldY = 0,
  worldWidth,
  worldHeight,
  reducedMotion,
  onComplete,
}: CameraIntroOptions): void {
  let cancelled = false;
  scene.events.once('shutdown', () => {
    cancelled = true;
  });

  const maxScrollX = Math.max(worldX, worldX + worldWidth - camera.width);
  const maxScrollY = Math.max(worldY, worldY + worldHeight - camera.height);
  const targetScrollX = Phaser.Math.Clamp(target.x - camera.width / 2, worldX, maxScrollX);
  const targetScrollY = Phaser.Math.Clamp(target.y - camera.height / 2, worldY, maxScrollY);
  const finish = (): void => {
    if (cancelled) return;
    camera.setScroll(targetScrollX, targetScrollY);
    camera.startFollow(target, true, 0.09, 0.09);
    onComplete();
  };

  camera.stopFollow();
  camera.setRoundPixels(true);

  if (reducedMotion) {
    camera.setScroll(targetScrollX, targetScrollY);
    camera.fadeIn(REDUCED_FADE_DURATION, 255, 250, 242);
    scene.time.delayedCall(REDUCED_FADE_DURATION + 20, finish);
    return;
  }

  camera.setScroll(targetScrollX, worldY);
  camera.fadeIn(FADE_DURATION, 255, 250, 242);
  scene.time.delayedCall(HOLD_DURATION, () => {
    if (cancelled) return;
    scene.tweens.add({
      targets: camera,
      scrollY: targetScrollY,
      duration: PAN_DURATION,
      ease: 'Sine.inOut',
      onComplete: finish,
    });
  });
}
