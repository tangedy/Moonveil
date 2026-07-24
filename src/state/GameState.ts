import {
  Facing,
  MOVEMENT,
  PROLOGUE_GEOMETRY,
  SAVE_SCHEMA_VERSION,
  SceneId,
  type SceneId as SceneName,
} from '../game/config';

export type MothQuestion = 'where' | 'moth' | 'self';
export type PhantomEvent = 'chair-recognition' | 'star-recognition';

export interface Position {
  x: number;
  y: number;
}

export interface MoonveilState {
  version: typeof SAVE_SCHEMA_VERSION;
  currentScene: SceneName;
  lastSafe: {
    scene: SceneName;
    position: Position;
  };
  facing: (typeof Facing)[keyof typeof Facing];
  steps: {
    real: number;
    phantom: number;
    remainder: number;
    phantomEvents: PhantomEvent[];
  };
  prologue: {
    loopCount: number;
    flowerRevealed: boolean;
    chairTurned: boolean;
    mothAppeared: boolean;
    askedQuestions: MothQuestion[];
    pathRevealed: boolean;
  };
  garden: {
    mothSpoken: boolean;
    sproutSpoken: boolean;
    pondExamined: boolean;
    starDiscovered: boolean;
    starTaken: boolean;
    consequenceResolved: boolean;
    whiteFlower: boolean;
    archUnlocked: boolean;
  };
  preferences: {
    muted: boolean;
    reducedMotion: boolean;
    textSpeed: 'slow' | 'normal' | 'fast';
  };
  sliceComplete: boolean;
  playtimeSeconds: number;
}

export type StateListener = (state: Readonly<MoonveilState>) => void;

export function createDefaultState(): MoonveilState {
  return {
    version: SAVE_SCHEMA_VERSION,
    currentScene: SceneId.Prologue,
    lastSafe: {
      scene: SceneId.Prologue,
      position: { x: PROLOGUE_GEOMETRY.spawnX, y: PROLOGUE_GEOMETRY.spawnY },
    },
    facing: Facing.Up,
    steps: {
      real: 0,
      phantom: 0,
      remainder: 0,
      phantomEvents: [],
    },
    prologue: {
      loopCount: 0,
      flowerRevealed: false,
      chairTurned: false,
      mothAppeared: false,
      askedQuestions: [],
      pathRevealed: false,
    },
    garden: {
      mothSpoken: false,
      sproutSpoken: false,
      pondExamined: false,
      starDiscovered: false,
      starTaken: false,
      consequenceResolved: false,
      whiteFlower: false,
      archUnlocked: false,
    },
    preferences: {
      muted: false,
      reducedMotion: false,
      textSpeed: 'normal',
    },
    sliceComplete: false,
    playtimeSeconds: 0,
  };
}

function cloneState(state: MoonveilState): MoonveilState {
  return structuredClone(state);
}

export class GameStateStore {
  private state: MoonveilState;
  private readonly listeners = new Set<StateListener>();

  constructor(initialState: MoonveilState = createDefaultState()) {
    this.state = cloneState(initialState);
  }

  get snapshot(): Readonly<MoonveilState> {
    return cloneState(this.state);
  }

  replace(next: MoonveilState): void {
    this.state = cloneState(next);
    this.emit();
  }

  reset(): void {
    this.state = createDefaultState();
    this.emit();
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  setScene(scene: SceneName, position: Position): void {
    this.state.currentScene = scene;
    this.state.lastSafe = { scene, position: { ...position } };
    this.emit();
  }

  setSafePosition(position: Position): void {
    this.state.lastSafe = {
      scene: this.state.currentScene,
      position: { x: Math.round(position.x * 100) / 100, y: Math.round(position.y * 100) / 100 },
    };
  }

  setFacing(facing: MoonveilState['facing']): void {
    this.state.facing = facing;
  }

  addTravelDistance(distance: number): number {
    if (!Number.isFinite(distance) || distance <= 0) return 0;

    const total = this.state.steps.remainder + distance;
    const gained = Math.floor(total / MOVEMENT.strideLength);
    this.state.steps.remainder = total % MOVEMENT.strideLength;
    if (gained > 0) {
      this.state.steps.real += gained;
      this.emit();
    }
    return gained;
  }

  addPhantomSteps(event: PhantomEvent, amount: number): boolean {
    if (this.state.steps.phantomEvents.includes(event)) return false;
    this.state.steps.phantomEvents.push(event);
    this.state.steps.phantom += Math.max(0, Math.floor(amount));
    this.emit();
    return true;
  }

  advancePrologueLoop(): number {
    if (this.state.prologue.loopCount >= 3) return this.state.prologue.loopCount;

    this.state.prologue.loopCount += 1;
    if (this.state.prologue.loopCount >= 1) this.state.prologue.flowerRevealed = true;
    if (this.state.prologue.loopCount >= 2) {
      this.state.prologue.chairTurned = true;
      this.addPhantomSteps('chair-recognition', 7);
    }
    if (this.state.prologue.loopCount >= 3) this.state.prologue.mothAppeared = true;
    this.emit();
    return this.state.prologue.loopCount;
  }

  askMothQuestion(question: MothQuestion): void {
    if (!this.state.prologue.askedQuestions.includes(question)) {
      this.state.prologue.askedQuestions.push(question);
      this.emit();
    }
  }

  revealPath(): void {
    if (this.state.prologue.pathRevealed) return;
    this.state.prologue.pathRevealed = true;
    this.emit();
  }

  markGardenInteraction(interaction: 'moth' | 'sprout' | 'pond' | 'star-discovered'): void {
    if (interaction === 'moth') this.state.garden.mothSpoken = true;
    if (interaction === 'sprout') this.state.garden.sproutSpoken = true;
    if (interaction === 'pond') this.state.garden.pondExamined = true;
    if (interaction === 'star-discovered') this.state.garden.starDiscovered = true;
    this.emit();
  }

  resolveVioletStar(): boolean {
    if (this.state.garden.consequenceResolved) return false;
    this.state.garden.starDiscovered = true;
    this.state.garden.starTaken = true;
    this.state.garden.consequenceResolved = true;
    this.state.garden.whiteFlower = true;
    this.state.garden.archUnlocked = true;
    this.addPhantomSteps('star-recognition', 13);
    this.emit();
    return true;
  }

  setPreference<K extends keyof MoonveilState['preferences']>(
    key: K,
    value: MoonveilState['preferences'][K],
  ): void {
    this.state.preferences[key] = value;
    this.emit();
  }

  completeSlice(): void {
    this.state.sliceComplete = true;
    this.state.currentScene = SceneId.SliceEnd;
    this.state.lastSafe = { scene: SceneId.SliceEnd, position: { x: 160, y: 90 } };
    this.emit();
  }

  addPlaytime(seconds: number): void {
    if (Number.isFinite(seconds) && seconds > 0) this.state.playtimeSeconds += seconds;
  }

  private emit(): void {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
