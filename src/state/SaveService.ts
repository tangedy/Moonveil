import {
  PROLOGUE_GEOMETRY,
  SAVE_KEY,
  SAVE_SCHEMA_VERSION,
  SceneId,
  type SceneId as SceneName,
} from '../game/config';
import { createDefaultState, type MoonveilState } from './GameState';

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

function hasMoonveilShape(value: unknown, version: number): boolean {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<MoonveilState> & { version?: number };
  return (
    candidate.version === version &&
    typeof candidate.currentScene === 'string' &&
    validScenes.has(candidate.currentScene as SceneName) &&
    !!candidate.lastSafe &&
    typeof candidate.lastSafe.position?.x === 'number' &&
    typeof candidate.lastSafe.position?.y === 'number' &&
    !!candidate.steps &&
    typeof candidate.steps.real === 'number' &&
    typeof candidate.steps.phantom === 'number' &&
    Array.isArray(candidate.steps.phantomEvents) &&
    !!candidate.prologue &&
    Array.isArray(candidate.prologue.askedQuestions) &&
    !!candidate.garden &&
    typeof candidate.garden.starTaken === 'boolean' &&
    !!candidate.preferences &&
    typeof candidate.preferences.muted === 'boolean' &&
    typeof candidate.sliceComplete === 'boolean'
  );
}

export function isMoonveilState(value: unknown): value is MoonveilState {
  return hasMoonveilShape(value, SAVE_SCHEMA_VERSION);
}

function migrateLegacy(value: unknown): MoonveilState | null {
  if (!value || typeof value !== 'object') return null;
  const legacy = value as { schema?: number; state?: unknown };

  if (legacy.schema === 1 && hasMoonveilShape(legacy.state, 1)) {
    const migrated = structuredClone(legacy.state) as Omit<MoonveilState, 'version'> & { version: number };
    migrated.version = SAVE_SCHEMA_VERSION;
    if (migrated.lastSafe.scene === SceneId.Prologue) {
      migrated.lastSafe.position.x += PROLOGUE_GEOMETRY.roomOffsetX;
      migrated.lastSafe.position.y += PROLOGUE_GEOMETRY.roomOffsetY;
    }
    return migrated as MoonveilState;
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
          return structuredClone(envelope.state);
        }
        const migrated = migrateLegacy(parsed);
        if (migrated) {
          this.save(migrated);
          return migrated;
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
