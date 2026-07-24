import type { Point } from './InteractionSystem';

export interface Ellipse {
  centerX: number;
  centerY: number;
  radiusX: number;
  radiusY: number;
}

export function projectInsideEllipse(point: Point, ellipse: Ellipse, minimumRadiusRatio = 0.08): Point {
  const dx = point.x - ellipse.centerX;
  const dy = point.y - ellipse.centerY;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return { x: ellipse.centerX, y: ellipse.centerY };
  }

  const denominator = Math.sqrt(
    (dx * dx) / (ellipse.radiusX * ellipse.radiusX) +
    (dy * dy) / (ellipse.radiusY * ellipse.radiusY),
  );
  const boundaryScale = denominator > 0 ? 1 / denominator : 0;
  const distanceFromCenter = Math.hypot(dx, dy);
  const distanceToBoundary = distanceFromCenter * boundaryScale;
  const distanceOutsidePond = Math.max(0, distanceFromCenter - distanceToBoundary);
  const minimumDistance = distanceToBoundary * Math.max(0, Math.min(1, minimumRadiusRatio));
  const reflectedDistance = Math.max(minimumDistance, distanceToBoundary - distanceOutsidePond);
  const scale = distanceFromCenter > 0 ? reflectedDistance / distanceFromCenter : 0;
  return {
    x: ellipse.centerX + dx * scale,
    y: ellipse.centerY + dy * scale,
  };
}

/** Rotation so a down-facing sprite's feet aim from `from` toward `toward`. */
export function reflectionFeetRotation(from: Point, toward: Point): number {
  const angle = Math.atan2(toward.y - from.y, toward.x - from.x);
  return angle - Math.PI / 2;
}
