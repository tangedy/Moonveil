import { describe, expect, it } from 'vitest';
import { SceneId } from '../../src/game/config';
import { GameStateStore, createDefaultState, portraitSubjectFor, starOutcomeFor } from '../../src/state/GameState';

describe('GameStateStore', () => {
  it('creates a fresh prologue state', () => {
    const state = createDefaultState();
    expect(state.currentScene).toBe(SceneId.Prologue);
    expect(state.prologue.loopCount).toBe(0);
    expect(state.garden.starTaken).toBe(false);
    expect(state.house.roomsEntered).toEqual([]);
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

  it('completes the Garden directly at the House approach spawn', () => {
    const store = new GameStateStore();
    const spawn = { x: 42, y: 112 };
    store.completeSlice(SceneId.HouseThreshold, spawn);
    expect(store.snapshot.garden.complete).toBe(true);
    expect(store.snapshot.currentScene).toBe(SceneId.HouseThreshold);
    expect(store.snapshot.lastSafe).toEqual({ scene: SceneId.HouseThreshold, position: spawn });
  });

  it('locks the first House observation and its portrait subject', () => {
    expect(portraitSubjectFor('portrait')).toBe('woman');
    expect(portraitSubjectFor('window')).toBe('empty-chair');
    expect(portraitSubjectFor('drawer')).toBe('dreamer');

    const store = new GameStateStore();
    expect(store.observeHouseFirst('window')).toBe('empty-chair');
    expect(store.observeHouseFirst('portrait')).toBe('empty-chair');
    expect(store.snapshot.house).toMatchObject({
      firstObservation: 'window',
      portraitSubject: 'empty-chair',
    });
  });

  it('resolves both associations once and admits Sprout after the second', () => {
    const store = new GameStateStore();
    expect(store.resolveBreadAssociation('welcome')).toBe(true);
    expect(store.resolveBreadAssociation('habit')).toBe(false);
    expect(store.snapshot.house.sproutArrived).toBe(false);
    expect(store.resolveToyAssociation('company')).toBe(true);
    expect(store.resolveToyAssociation('waiting')).toBe(false);
    expect(store.snapshot.house).toMatchObject({
      breadInterpretation: 'welcome',
      toyInterpretation: 'company',
      sproutArrived: true,
    });
  });

  it('admits Sprout after the second association in either order', () => {
    const store = new GameStateStore();
    store.resolveToyAssociation('waiting');
    expect(store.snapshot.house.sproutArrived).toBe(false);
    store.resolveBreadAssociation('habit');
    expect(store.snapshot.house.sproutArrived).toBe(true);
  });

  it.each([
    ['outside-unknown', 'left'],
    ['house-changing', 'shared'],
    ['safe-here', 'remained'],
    ['choose', 'delayed'],
  ] as const)('maps %s to the autonomous %s outcome and converges', (statement, outcome) => {
    expect(starOutcomeFor(statement)).toBe(outcome);
    const store = new GameStateStore();
    store.resolveBreadAssociation('difficult-mornings');
    store.resolveToyAssociation('forgotten');
    store.setPhotographBelief('keeper');
    expect(store.resolveHouseStar(statement)).toBe(outcome);
    expect(store.resolveHouseStar('choose')).toBe(outcome);
    expect(store.snapshot.house.unkeptDiscovered).toBe(true);
    expect(store.snapshot.house.photographBelief).toBe('keeper');
  });

  it('opens the living passage and completes the House idempotently', () => {
    const store = new GameStateStore();
    expect(store.plantHouseLeaf()).toBe(true);
    expect(store.plantHouseLeaf()).toBe(false);
    expect(store.snapshot.house.exitOpened).toBe(true);
    store.completeHouse();
    store.completeHouse();
    expect(store.snapshot.house.complete).toBe(true);
    expect(store.snapshot.currentScene).toBe(SceneId.SliceEnd);
  });

  it('persists interaction-driven Garden and Keeper dialogue stages', () => {
    const store = new GameStateStore();
    store.advanceGardenMothBeforeStar();
    store.markGardenMothPondResponse();
    store.advanceGardenMothAfterStar();
    store.advanceKeeperIntroduction(5);
    store.markThresholdMothSpoken();
    store.markKeeperRoomConversation('sitting-room');
    store.markKeeperRoomConversation('sitting-room');

    expect(store.snapshot.garden).toMatchObject({
      mothBeforeStarStep: 1,
      mothPondResponseHeard: true,
      mothAfterStarStep: 1,
    });
    expect(store.snapshot.house).toMatchObject({
      keeperMet: true,
      keeperIntroductionStep: 1,
      thresholdMothSpoken: true,
      keeperRoomConversations: ['sitting-room'],
    });
  });
});
