import { Facing, MOVEMENT, type Facing as FacingDirection } from '../game/config';

export interface Point {
  x: number;
  y: number;
}

export interface InteractionTarget {
  id: string;
  kind: 'npc' | 'object';
  x: number;
  y: number;
  radius?: number;
  enabled?: () => boolean;
  interact: () => void | Promise<void>;
}

const facingVectors: Record<FacingDirection, Point> = {
  [Facing.Up]: { x: 0, y: -1 },
  [Facing.Down]: { x: 0, y: 1 },
  [Facing.Left]: { x: -1, y: 0 },
  [Facing.Right]: { x: 1, y: 0 },
};

export function findBestInteraction(
  origin: Point,
  facing: FacingDirection,
  targets: readonly InteractionTarget[],
  range = MOVEMENT.interactionRange,
): InteractionTarget | null {
  const forward = facingVectors[facing];
  const ranked = targets
    .filter((target) => target.enabled?.() ?? true)
    .map((target) => {
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const centerDistance = Math.hypot(dx, dy);
      const edgeDistance = Math.max(0, centerDistance - (target.radius ?? 0));
      const alignment = centerDistance < 0.001 ? 1 : (dx * forward.x + dy * forward.y) / centerDistance;
      const kindBonus = target.kind === 'npc' ? 100 : 0;
      return { target, edgeDistance, alignment, score: kindBonus + alignment * 40 - edgeDistance };
    })
    .filter(({ edgeDistance, alignment }) => edgeDistance <= range && alignment >= 0.12)
    .sort((a, b) => b.score - a.score || a.edgeDistance - b.edgeDistance);

  return ranked[0]?.target ?? null;
}

export class InteractionSystem {
  private readonly targets = new Map<string, InteractionTarget>();

  add(target: InteractionTarget): void {
    this.targets.set(target.id, target);
  }

  remove(id: string): void {
    this.targets.delete(id);
  }

  clear(): void {
    this.targets.clear();
  }

  async tryInteract(origin: Point, facing: FacingDirection): Promise<boolean> {
    const target = findBestInteraction(origin, facing, [...this.targets.values()]);
    if (!target) return false;
    await target.interact();
    return true;
  }
}
