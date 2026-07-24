import { describe, expect, it } from 'vitest';
import { addDistanceToSteps, displayedSteps, formatSteps } from '../../src/systems/StepCounter';

describe('StepCounter', () => {
  it('does not count idle or invalid movement', () => {
    const state = { real: 2, phantom: 7, remainder: 3 };
    expect(addDistanceToSteps(state, 0)).toEqual(state);
    expect(addDistanceToSteps(state, Number.NaN)).toEqual(state);
  });

  it('combines real and impossible steps only for display', () => {
    const state = { real: 12, phantom: 7, remainder: 0 };
    expect(displayedSteps(state)).toBe(19);
    expect(formatSteps(state)).toBe('STEPS 0019');
  });
});
