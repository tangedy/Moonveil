import type { Position } from '../state/GameState';

export interface WorldWrapBounds {
  left?: number;
  top?: number;
  width: number;
  height: number;
}

export interface WorldWrapResult {
  position: Position;
  delta: Position;
  horizontal: 'left-to-right' | 'right-to-left' | null;
  vertical: 'top-to-bottom' | 'bottom-to-top' | null;
}

export function resolveWorldWrap(position: Position, bounds: WorldWrapBounds): WorldWrapResult | null {
  const left = bounds.left ?? 0;
  const top = bounds.top ?? 0;
  const right = left + bounds.width;
  const bottom = top + bounds.height;
  let x = position.x;
  let y = position.y;
  let horizontal: WorldWrapResult['horizontal'] = null;
  let vertical: WorldWrapResult['vertical'] = null;

  if (x < left) {
    x += bounds.width;
    horizontal = 'left-to-right';
  } else if (x >= right) {
    x -= bounds.width;
    horizontal = 'right-to-left';
  }

  if (y < top) {
    y += bounds.height;
    vertical = 'top-to-bottom';
  } else if (y >= bottom) {
    y -= bounds.height;
    vertical = 'bottom-to-top';
  }

  if (!horizontal && !vertical) return null;
  return {
    position: { x, y },
    delta: { x: x - position.x, y: y - position.y },
    horizontal,
    vertical,
  };
}
