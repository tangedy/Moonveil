import { MOVEMENT } from '../game/config';

export interface StepState {
  real: number;
  phantom: number;
  remainder: number;
}

export function addDistanceToSteps(state: StepState, distance: number): StepState {
  if (!Number.isFinite(distance) || distance <= 0) return { ...state };
  const total = state.remainder + distance;
  return {
    real: state.real + Math.floor(total / MOVEMENT.strideLength),
    phantom: state.phantom,
    remainder: total % MOVEMENT.strideLength,
  };
}

export function displayedSteps(state: Pick<StepState, 'real' | 'phantom'>): number {
  return state.real + state.phantom;
}

export function formatSteps(state: Pick<StepState, 'real' | 'phantom'>): string {
  return `STEPS ${displayedSteps(state).toString().padStart(4, '0')}`;
}
