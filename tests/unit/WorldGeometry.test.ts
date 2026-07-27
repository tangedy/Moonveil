import { describe, expect, it } from 'vitest';
import { PROLOGUE_GEOMETRY } from '../../src/game/config';
import { projectInsideEllipse, reflectionFeetRotation } from '../../src/systems/PondReflection';
import { resolveWorldWrap } from '../../src/systems/WorldWrap';

const wrapLeft = PROLOGUE_GEOMETRY.wrapLeft;
const wrapRight = PROLOGUE_GEOMETRY.wrapRight;
const wrapWidth = wrapRight - wrapLeft;
const wrapHeight = PROLOGUE_GEOMETRY.worldHeight + PROLOGUE_GEOMETRY.wrapPaddingY * 2;
const wrapBounds = {
  left: wrapLeft,
  top: -PROLOGUE_GEOMETRY.wrapPaddingY,
  width: wrapWidth,
  height: wrapHeight,
};
const pathWidth = PROLOGUE_GEOMETRY.pathWrapRight - wrapLeft;

describe('resolveWorldWrap', () => {
  it('does nothing while DREAMER remains inside the world seam', () => {
    expect(resolveWorldWrap({ x: 320, y: 180 }, wrapBounds)).toBeNull();
  });

  it('wraps horizontally to the opposite side and preserves y', () => {
    expect(resolveWorldWrap({ x: wrapLeft - 1, y: 123 }, wrapBounds)).toEqual({
      position: { x: wrapRight - 1, y: 123 },
      delta: { x: wrapWidth, y: 0 },
      horizontal: 'left-to-right',
      vertical: null,
    });
    expect(resolveWorldWrap({ x: wrapRight, y: 237 }, wrapBounds)).toEqual({
      position: { x: wrapLeft, y: 237 },
      delta: { x: -wrapWidth, y: 0 },
      horizontal: 'right-to-left',
      vertical: null,
    });
  });

  it('wraps vertically and resolves diagonal corner crossings once', () => {
    expect(resolveWorldWrap({ x: 200, y: -91 }, wrapBounds)?.position).toEqual({ x: 200, y: 449 });
    expect(resolveWorldWrap({ x: wrapRight, y: 450 }, wrapBounds)).toEqual({
      position: { x: wrapLeft, y: -90 },
      delta: { x: -wrapWidth, y: -wrapHeight },
      horizontal: 'right-to-left',
      vertical: 'bottom-to-top',
    });
  });

  it('keeps DREAMER inside the expanded black corridor until its outer edge', () => {
    expect(resolveWorldWrap({ x: wrapLeft, y: -90 }, wrapBounds)).toBeNull();
    expect(resolveWorldWrap({ x: wrapRight - 1, y: 449 }, wrapBounds)).toBeNull();
  });

  it('supports the small right-side corridor added for the revealed path', () => {
    const pathBounds = { ...wrapBounds, width: pathWidth };
    expect(resolveWorldWrap({ x: wrapRight + 20, y: 180 }, pathBounds)).toBeNull();
    expect(resolveWorldWrap({ x: PROLOGUE_GEOMETRY.pathWrapRight, y: 180 }, pathBounds)?.position)
      .toEqual({ x: wrapLeft, y: 180 });
  });
});

describe('projectInsideEllipse', () => {
  const pond = { centerX: 350, centerY: 218, radiusX: 67, radiusY: 37 };

  it('mirrors a nearby player’s edge distance inside the pond', () => {
    expect(projectInsideEllipse({ x: 427, y: 218 }, pond)).toEqual({ x: 407, y: 218 });
    expect(projectInsideEllipse({ x: 273, y: 218 }, pond)).toEqual({ x: 293, y: 218 });
    expect(projectInsideEllipse({ x: 350, y: 265 }, pond)).toEqual({ x: 350, y: 245 });
    expect(projectInsideEllipse({ x: 350, y: 171 }, pond)).toEqual({ x: 350, y: 191 });
  });

  it('pushes the reflection deeper as the player moves farther away without reversing sides', () => {
    const near = projectInsideEllipse({ x: 427, y: 218 }, pond);
    const far = projectInsideEllipse({ x: 500, y: 218 }, pond);
    expect(far.x).toBeGreaterThan(pond.centerX);
    expect(far.x).toBeLessThan(near.x);
    expect(far.x).toBeCloseTo(355.36, 5);

    const diagonal = projectInsideEllipse({ x: 470, y: 300 }, pond);
    expect(diagonal.x).toBeGreaterThan(pond.centerX);
    expect(diagonal.y).toBeGreaterThan(pond.centerY);
  });
});

describe('reflectionFeetRotation', () => {
  it('points feet toward the player around the pond', () => {
    const reflection = { x: 350, y: 218 };
    expect(reflectionFeetRotation(reflection, { x: 350, y: 300 })).toBeCloseTo(0, 5);
    expect(reflectionFeetRotation(reflection, { x: 350, y: 100 })).toBeCloseTo(-Math.PI, 5);
    expect(reflectionFeetRotation(reflection, { x: 500, y: 218 })).toBeCloseTo(-Math.PI / 2, 5);
    expect(reflectionFeetRotation(reflection, { x: 200, y: 218 })).toBeCloseTo(Math.PI / 2, 5);
  });
});
