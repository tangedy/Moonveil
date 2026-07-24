import { describe, expect, it, vi } from 'vitest';
import { Facing } from '../../src/game/config';
import { findBestInteraction, InteractionSystem, type InteractionTarget } from '../../src/systems/InteractionSystem';

function target(overrides: Partial<InteractionTarget>): InteractionTarget {
  return {
    id: 'target',
    kind: 'object',
    x: 0,
    y: 0,
    interact: vi.fn(),
    ...overrides,
  };
}

describe('InteractionSystem', () => {
  it('ignores targets behind DREAMER', () => {
    const result = findBestInteraction(
      { x: 10, y: 10 },
      Facing.Right,
      [target({ id: 'behind', x: 2, y: 10 })],
    );
    expect(result).toBeNull();
  });

  it('prefers an NPC when candidates overlap', () => {
    const object = target({ id: 'flower', kind: 'object', x: 20, y: 10 });
    const npc = target({ id: 'moth', kind: 'npc', x: 21, y: 10 });
    expect(findBestInteraction({ x: 10, y: 10 }, Facing.Right, [object, npc])?.id).toBe('moth');
  });

  it('honors enabled predicates and invokes the winner', async () => {
    const disabledAction = vi.fn();
    const enabledAction = vi.fn();
    const system = new InteractionSystem();
    system.add(target({ id: 'sleeping', x: 15, enabled: () => false, interact: disabledAction }));
    system.add(target({ id: 'awake', x: 17, interact: enabledAction }));
    expect(await system.tryInteract({ x: 10, y: 0 }, Facing.Right)).toBe(true);
    expect(disabledAction).not.toHaveBeenCalled();
    expect(enabledAction).toHaveBeenCalledOnce();
  });
});
