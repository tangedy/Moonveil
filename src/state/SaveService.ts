import {
  Facing,
  PROLOGUE_GEOMETRY,
  SAVE_KEY,
  SAVE_SCHEMA_VERSION,
  SceneId,
  type SceneId as SceneName,
} from '../game/config';
import {
  createDefaultHouseState,
  createDefaultState,
  type HouseState,
  type MoonveilState,
} from './GameState';

interface SaveEnvelope {
  schema: typeof SAVE_SCHEMA_VERSION;
  savedAt: number;
  state: MoonveilState;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const validScenes = new Set<SceneName>(Object.values(SceneId));
const validFacings = new Set(Object.values(Facing));
const validRooms = new Set(['threshold', 'sitting-room', 'bedroom', 'hallway', 'kitchen', 'nursery', 'unkept-room']);
const validObservations = new Set(['portrait', 'window', 'drawer']);
const validPortraitSubjects = new Set(['woman', 'empty-chair', 'dreamer']);
const validBreadInterpretations = new Set(['difficult-mornings', 'welcome', 'habit']);
const validToyInterpretations = new Set(['company', 'forgotten', 'waiting']);
const validPhotographBeliefs = new Set(['dreamer', 'keeper', 'neither']);
const validStarStatements = new Set(['outside-unknown', 'house-changing', 'safe-here', 'choose']);
const validStarOutcomes = new Set(['left', 'shared', 'remained', 'delayed']);

function isNullableMember(value: unknown, values: ReadonlySet<string>): boolean {
  return value === null || (typeof value === 'string' && values.has(value));
}

function normalizeDerivedState(state: MoonveilState): MoonveilState {
  state.house.sproutArrived = Boolean(state.house.breadInterpretation && state.house.toyInterpretation);
  if (!state.house.sproutArrived) state.house.sproutSpoken = false;
  if (
    state.currentScene === SceneId.HouseThreshold &&
    state.lastSafe.scene === SceneId.HouseThreshold &&
    Math.abs(state.lastSafe.position.x - 274) < 0.01
  ) {
    state.lastSafe.position.x = 914;
  }
  return state;
}

function hasHouseShape(value: unknown): value is HouseState {
  if (!value || typeof value !== 'object') return false;
  const house = value as Partial<HouseState>;
  return (
    Array.isArray(house.roomsEntered) &&
    house.roomsEntered.every((room) => typeof room === 'string' && validRooms.has(room)) &&
    Array.isArray(house.keeperRoomConversations) &&
    house.keeperRoomConversations.every((room) => typeof room === 'string' && validRooms.has(room)) &&
    isNullableMember(house.firstObservation, validObservations) &&
    isNullableMember(house.portraitSubject, validPortraitSubjects) &&
    typeof house.portraitCommented === 'boolean' &&
    isNullableMember(house.breadInterpretation, validBreadInterpretations) &&
    isNullableMember(house.toyInterpretation, validToyInterpretations) &&
    typeof house.keeperMet === 'boolean' &&
    Number.isInteger(house.keeperIntroductionStep) &&
    (house.keeperIntroductionStep ?? -1) >= 0 &&
    typeof house.thresholdMothSpoken === 'boolean' &&
    typeof house.mothHistoryHeard === 'boolean' &&
    typeof house.sproutArrived === 'boolean' &&
    typeof house.sproutSpoken === 'boolean' &&
    typeof house.photographDiscovered === 'boolean' &&
    isNullableMember(house.photographBelief, validPhotographBeliefs) &&
    isNullableMember(house.starStatement, validStarStatements) &&
    isNullableMember(house.starOutcome, validStarOutcomes) &&
    typeof house.unkeptDiscovered === 'boolean' &&
    typeof house.leafPlanted === 'boolean' &&
    typeof house.exitOpened === 'boolean' &&
    typeof house.complete === 'boolean'
  );
}

function hasBaseMoonveilShape(value: unknown, version: number): boolean {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MoonveilState> & { version?: number };
  return (
    candidate.version === version &&
    typeof candidate.currentScene === 'string' &&
    validScenes.has(candidate.currentScene as SceneName) &&
    !!candidate.lastSafe &&
    typeof candidate.lastSafe.scene === 'string' &&
    validScenes.has(candidate.lastSafe.scene as SceneName) &&
    typeof candidate.lastSafe.position?.x === 'number' &&
    typeof candidate.lastSafe.position?.y === 'number' &&
    typeof candidate.facing === 'string' &&
    validFacings.has(candidate.facing) &&
    !!candidate.steps &&
    typeof candidate.steps.real === 'number' &&
    typeof candidate.steps.phantom === 'number' &&
    Array.isArray(candidate.steps.phantomEvents) &&
    !!candidate.prologue &&
    Array.isArray(candidate.prologue.askedQuestions) &&
    !!candidate.garden &&
    typeof candidate.garden.starTaken === 'boolean' &&
    !!candidate.preferences &&
    typeof candidate.preferences.muted === 'boolean'
  );
}

export function isMoonveilState(value: unknown): value is MoonveilState {
  if (!hasBaseMoonveilShape(value, SAVE_SCHEMA_VERSION)) return false;
  const candidate = value as Partial<MoonveilState>;
  return (
    typeof candidate.garden?.complete === 'boolean' &&
    Number.isInteger(candidate.garden.mothBeforeStarStep) &&
    candidate.garden.mothBeforeStarStep >= 0 &&
    typeof candidate.garden.mothPondResponseHeard === 'boolean' &&
    Number.isInteger(candidate.garden.mothAfterStarStep) &&
    candidate.garden.mothAfterStarStep >= 0 &&
    hasHouseShape(candidate.house)
  );
}

function migrateLegacy(value: unknown): MoonveilState | null {
  if (!value || typeof value !== 'object') return null;
  const legacy = value as { schema?: number; state?: unknown };

  if ((legacy.schema === 1 || legacy.schema === 2 || legacy.schema === 3) && hasBaseMoonveilShape(legacy.state, legacy.schema)) {
    const oldState = structuredClone(legacy.state) as Record<string, unknown>;
    const migrated = createDefaultState();
    migrated.currentScene = oldState.currentScene as SceneName;
    migrated.lastSafe = oldState.lastSafe as MoonveilState['lastSafe'];
    migrated.facing = oldState.facing as MoonveilState['facing'];
    migrated.steps = oldState.steps as MoonveilState['steps'];
    migrated.prologue = oldState.prologue as MoonveilState['prologue'];
    migrated.garden = {
      ...migrated.garden,
      ...(oldState.garden as Partial<MoonveilState['garden']>),
      complete: legacy.schema === 3
        ? (oldState.garden as Partial<MoonveilState['garden']>).complete === true
        : oldState.sliceComplete === true,
    };
    if (legacy.schema === 3) {
      const oldHouse = oldState.house as Partial<HouseState>;
      migrated.house = { ...createDefaultHouseState(), ...oldHouse };
      if (oldHouse.keeperMet) {
        migrated.house.keeperIntroductionStep = 5;
        migrated.house.thresholdMothSpoken = true;
      }
      migrated.house.keeperRoomConversations = (oldHouse.roomsEntered ?? [])
        .filter((room) => room !== 'threshold');
    } else {
      migrated.house = createDefaultHouseState();
    }
    migrated.preferences = oldState.preferences as MoonveilState['preferences'];
    migrated.playtimeSeconds = typeof oldState.playtimeSeconds === 'number' ? oldState.playtimeSeconds : 0;
    if (legacy.schema === 1 && migrated.lastSafe.scene === SceneId.Prologue) {
      migrated.lastSafe.position.x += PROLOGUE_GEOMETRY.roomOffsetX;
      migrated.lastSafe.position.y += PROLOGUE_GEOMETRY.roomOffsetY;
    }
    return migrated;
  }

  if (legacy.schema !== 0 || !legacy.state || typeof legacy.state !== 'object') return null;

  const migrated = createDefaultState();
  const legacySteps = (legacy.state as Record<string, unknown>).stepCount;
  if (typeof legacySteps === 'number' && Number.isFinite(legacySteps)) {
    migrated.steps.real = Math.max(0, Math.floor(legacySteps));
  }
  return migrated;
}

export class SaveService {
  constructor(private readonly storage: StorageLike = window.localStorage) {}

  hasSave(): boolean {
    return this.storage.getItem(SAVE_KEY) !== null;
  }

  save(state: Readonly<MoonveilState>): void {
    const envelope: SaveEnvelope = {
      schema: SAVE_SCHEMA_VERSION,
      savedAt: Date.now(),
      state: structuredClone(state) as MoonveilState,
    };
    this.storage.setItem(SAVE_KEY, JSON.stringify(envelope));
  }

  load(): MoonveilState | null {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object') {
        const envelope = parsed as Partial<SaveEnvelope>;
        if (envelope.schema === SAVE_SCHEMA_VERSION && isMoonveilState(envelope.state)) {
          const state = normalizeDerivedState(structuredClone(envelope.state));
          this.save(state);
          return state;
        }
        const migrated = migrateLegacy(parsed);
        if (migrated) {
          const state = normalizeDerivedState(migrated);
          this.save(state);
          return state;
        }
      }
    } catch {
      // Corrupt saves are removed below so the launch screen can recover cleanly.
    }

    this.clear();
    return null;
  }

  clear(): void {
    this.storage.removeItem(SAVE_KEY);
  }
}
