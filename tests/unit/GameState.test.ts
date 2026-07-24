import { describe, expect, it } from 'vitest';
import { SceneId } from '../../src/game/config';
import { GameStateStore, createDefaultState } from '../../src/state/GameState';

describe('GameStateStore', () => {
  it('creates a fresh prologue state', () => {
    const state = createDefaultState();
    expect(state.currentScene).toBe(SceneId.Prologue);
    expect(state.prologue.loopCount).toBe(0);
    expect(state.garden.starTaken).toBe(false);
    expect(state.steps.real + state.steps.phantom).toBe(0);
  });

  it('derives real steps from continuous distance and carries a remainder', () => {
    const store = new GameStateStore();
    expect(store.addTravelDistance(6)).toBe(0);
    expect(store.addTravelDistance(9)).toBe(1);
    expect(store.snapshot.steps.real).toBe(1);
    expect(store.snapshot.steps.remainder).toBe(5);
  });

  it('applies authored phantom steps only once', () => {
    const store = new GameStateStore();
    expect(store.addPhantomSteps('chair-recognition', 7)).toBe(true);
    expect(store.addPhantomSteps('chair-recognition', 7)).toBe(false);
    expect(store.snapshot.steps.phantom).toBe(7);
  });

  it('unfolds the three prologue loops deterministically', () => {
    const store = new GameStateStore();
    store.advancePrologueLoop();
    expect(store.snapshot.prologue.flowerRevealed).toBe(true);
    store.advancePrologueLoop();
    expect(store.snapshot.prologue.chairTurned).toBe(true);
    expect(store.snapshot.steps.phantom).toBe(7);
    store.advancePrologueLoop();
    store.advancePrologueLoop();
    expect(store.snapshot.prologue.loopCount).toBe(3);
    expect(store.snapshot.prologue.mothAppeared).toBe(true);
  });

  it('resolves the Violet Star atomically and idempotently', () => {
    const store = new GameStateStore();
    expect(store.resolveVioletStar()).toBe(true);
    expect(store.resolveVioletStar()).toBe(false);
    expect(store.snapshot.garden).toMatchObject({
      starTaken: true,
      consequenceResolved: true,
      whiteFlower: true,
      archUnlocked: true,
    });
    expect(store.snapshot.steps.phantom).toBe(13);
  });
});
