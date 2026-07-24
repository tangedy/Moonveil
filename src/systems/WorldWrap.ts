import type { Position } from '../state/GameState';

export interface WorldWrapBounds {
  width: number;
  height: number;
  margin: number;
  inset: number;
}

export interface WorldWrapResult {
  position: Position;
  horizontal: 'left-to-right' | 'right-to-left' | null;
  vertical: 'top-to-bottom' | 'bottom-to-top' | null;
}

export function resolveWorldWrap(position: Position, bounds: WorldWrapBounds): WorldWrapResult | null {
  let x = position.x;
  let y = position.y;
  let horizontal: WorldWrapResult['horizontal'] = null;
  let vertical: WorldWrapResult['vertical'] = null;

  if (x < -bounds.margin) {
    x = bounds.width - bounds.inset;
    horizontal = 'left-to-right';
  } else if (x > bounds.width + bounds.margin) {
    x = bounds.inset;
    horizontal = 'right-to-left';
  }

  if (y < -bounds.margin) {
    y = bounds.height - bounds.inset;
    vertical = 'top-to-bottom';
  } else if (y > bounds.height + bounds.margin) {
    y = bounds.inset;
    vertical = 'bottom-to-top';
  }

  if (!horizontal && !vertical) return null;
  return { position: { x, y }, horizontal, vertical };
}
