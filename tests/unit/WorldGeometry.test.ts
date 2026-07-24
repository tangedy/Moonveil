import { describe, expect, it } from 'vitest';
import { projectInsideEllipse } from '../../src/systems/PondReflection';
import { resolveWorldWrap } from '../../src/systems/WorldWrap';

const wrapBounds = { width: 640, height: 360, margin: 8, inset: 10 };

describe('resolveWorldWrap', () => {
  it('does nothing while DREAMER remains inside the world seam', () => {
    expect(resolveWorldWrap({ x: 320, y: 180 }, wrapBounds)).toBeNull();
  });

  it('wraps horizontally to the opposite side and preserves y', () => {
    expect(resolveWorldWrap({ x: -9, y: 123 }, wrapBounds)).toEqual({
      position: { x: 630, y: 123 },
      horizontal: 'left-to-right',
      vertical: null,
    });
    expect(resolveWorldWrap({ x: 649, y: 237 }, wrapBounds)).toEqual({
      position: { x: 10, y: 237 },
      horizontal: 'right-to-left',
      vertical: null,
    });
  });

  it('wraps vertically and resolves diagonal corner crossings once', () => {
    expect(resolveWorldWrap({ x: 200, y: -9 }, wrapBounds)?.position).toEqual({ x: 200, y: 350 });
    expect(resolveWorldWrap({ x: 649, y: 369 }, wrapBounds)).toEqual({
      position: { x: 10, y: 10 },
      horizontal: 'right-to-left',
      vertical: 'bottom-to-top',
    });
  });
});

describe('projectInsideEllipse', () => {
  const pond = { centerX: 350, centerY: 218, radiusX: 67, radiusY: 37 };

  it('keeps the reflection on DREAMER’s side of each pond axis', () => {
    expect(projectInsideEllipse({ x: 500, y: 218 }, pond)).toEqual({ x: 398.24, y: 218 });
    expect(projectInsideEllipse({ x: 200, y: 218 }, pond)).toEqual({ x: 301.76, y: 218 });
    expect(projectInsideEllipse({ x: 350, y: 100 }, pond)).toEqual({ x: 350, y: 191.36 });
    expect(projectInsideEllipse({ x: 350, y: 330 }, pond)).toEqual({ x: 350, y: 244.64 });
  });

  it('projects diagonal positions inside the ellipse without reversing either axis', () => {
    const projected = projectInsideEllipse({ x: 470, y: 300 }, pond);
    expect(projected.x).toBeGreaterThan(pond.centerX);
    expect(projected.y).toBeGreaterThan(pond.centerY);
    const normalized =
      ((projected.x - pond.centerX) ** 2) / (pond.radiusX ** 2) +
      ((projected.y - pond.centerY) ** 2) / (pond.radiusY ** 2);
    expect(normalized).toBeCloseTo(0.72 ** 2, 5);
  });
});
