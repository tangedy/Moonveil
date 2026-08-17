import { describe, expect, it } from 'vitest';
import { SAVE_KEY } from '../../src/game/config';
import { GameStateStore } from '../../src/state/GameState';
import { SaveService, type StorageLike } from '../../src/state/SaveService';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('SaveService', () => {
  it('round-trips a complete state without sharing references', () => {
    const storage = new MemoryStorage();
    const saves = new SaveService(storage);
    const store = new GameStateStore();
    store.advancePrologueLoop();
    store.askMothQuestion('where');
    saves.save(store.snapshot);

    const loaded = saves.load();
    expect(loaded).toEqual(store.snapshot);
    loaded!.prologue.loopCount = 99;
    expect(saves.load()!.prologue.loopCount).toBe(1);
  });

  it('normalizes Sprout arrival in saves from the old first-association rule', () => {
    const storage = new MemoryStorage();
    const saves = new SaveService(storage);
    const state = structuredClone(new GameStateStore().snapshot);
    state.house.breadInterpretation = 'welcome';
    state.house.sproutArrived = true;
    state.house.sproutSpoken = true;
    saves.save(state);

    expect(saves.load()?.house.sproutArrived).toBe(false);
    expect(saves.load()?.house.sproutSpoken).toBe(false);
  });

  it('rejects saves with an invalid interaction facing', () => {
    const storage = new MemoryStorage();
    const state = structuredClone(new GameStateStore().snapshot) as unknown as Record<string, unknown>;
    state.facing = 'sideways';
    storage.setItem(SAVE_KEY, JSON.stringify({ schema: 4, savedAt: 1, state }));

    const saves = new SaveService(storage);
    expect(saves.load()).toBeNull();
    expect(saves.hasSave()).toBe(false);
  });

  it('clears a corrupted save rather than loading partial data', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, '{definitely-not-json');
    const saves = new SaveService(storage);
    expect(saves.load()).toBeNull();
    expect(saves.hasSave()).toBe(false);
  });

  it('clears valid JSON that is not a Moonveil save', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify('not-a-save'));
    const saves = new SaveService(storage);
    expect(saves.load()).toBeNull();
    expect(saves.hasSave()).toBe(false);
  });

  it('migrates the legacy step counter envelope', () => {
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ schema: 0, state: { stepCount: 42 } }));
    const saves = new SaveService(storage);
    const loaded = saves.load();
    expect(loaded?.steps.real).toBe(42);
    expect(loaded?.version).toBe(4);
  });

  it('moves schema-v1 Prologue positions to the centered room', () => {
    const storage = new MemoryStorage();
    const legacyState = structuredClone(new GameStateStore().snapshot) as unknown as Record<string, unknown>;
    legacyState.version = 1;
    legacyState.lastSafe = { scene: 'Prologue', position: { x: 160, y: 118 } };
    storage.setItem(SAVE_KEY, JSON.stringify({ schema: 1, savedAt: 1, state: legacyState }));

    const loaded = new SaveService(storage).load();
    expect(loaded?.version).toBe(4);
    expect(loaded?.lastSafe.position).toEqual({ x: 320, y: 208 });
  });

  it('does not move schema-v1 Violet Garden positions', () => {
    const storage = new MemoryStorage();
    const legacyState = structuredClone(new GameStateStore().snapshot) as unknown as Record<string, unknown>;
    legacyState.version = 1;
    legacyState.currentScene = 'VioletGarden';
    legacyState.lastSafe = { scene: 'VioletGarden', position: { x: 54, y: 302 } };
    storage.setItem(SAVE_KEY, JSON.stringify({ schema: 1, savedAt: 1, state: legacyState }));

    const loaded = new SaveService(storage).load();
    expect(loaded?.version).toBe(4);
    expect(loaded?.lastSafe.position).toEqual({ x: 54, y: 302 });
  });

  it('migrates a completed schema-v2 Garden save into the House interlude', () => {
    const storage = new MemoryStorage();
    const legacyState = structuredClone(new GameStateStore().snapshot) as unknown as Record<string, unknown>;
    legacyState.version = 2;
    legacyState.currentScene = 'SliceEnd';
    legacyState.lastSafe = { scene: 'SliceEnd', position: { x: 160, y: 90 } };
    legacyState.sliceComplete = true;
    delete legacyState.house;
    storage.setItem(SAVE_KEY, JSON.stringify({ schema: 2, savedAt: 1, state: legacyState }));

    const loaded = new SaveService(storage).load();
    expect(loaded?.version).toBe(4);
    expect(loaded?.garden.complete).toBe(true);
    expect(loaded?.house.complete).toBe(false);
    expect(loaded?.house.roomsEntered).toEqual([]);
    expect(loaded?.currentScene).toBe('SliceEnd');
  });

  it('migrates schema-v3 progress without replaying previously forced dialogue', () => {
    const storage = new MemoryStorage();
    const legacyState = structuredClone(new GameStateStore().snapshot) as unknown as Record<string, unknown>;
    legacyState.version = 3;
    const garden = legacyState.garden as Record<string, unknown>;
    delete garden.mothBeforeStarStep;
    delete garden.mothPondResponseHeard;
    delete garden.mothAfterStarStep;
    const house = legacyState.house as Record<string, unknown>;
    delete house.keeperRoomConversations;
    delete house.keeperIntroductionStep;
    delete house.thresholdMothSpoken;
    house.keeperMet = true;
    storage.setItem(SAVE_KEY, JSON.stringify({ schema: 3, savedAt: 1, state: legacyState }));

    const loaded = new SaveService(storage).load();
    expect(loaded?.version).toBe(4);
    expect(loaded?.garden.mothBeforeStarStep).toBe(0);
    expect(loaded?.house.keeperIntroductionStep).toBe(5);
    expect(loaded?.house.keeperRoomConversations).toEqual([]);
    expect(loaded?.house.keeperMet).toBe(true);
    expect(loaded?.house.thresholdMothSpoken).toBe(true);
  });
});
