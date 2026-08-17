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
export type HouseRoomId = 'threshold' | 'sitting-room' | 'bedroom' | 'hallway' | 'kitchen' | 'nursery' | 'unkept-room';
export type HouseObservation = 'portrait' | 'window' | 'drawer';
export type PortraitSubject = 'woman' | 'empty-chair' | 'dreamer';
export type BreadInterpretation = 'difficult-mornings' | 'welcome' | 'habit';
export type ToyInterpretation = 'company' | 'forgotten' | 'waiting';
export type PhotographBelief = 'dreamer' | 'keeper' | 'neither';
export type StarStatement = 'outside-unknown' | 'house-changing' | 'safe-here' | 'choose';
export type HouseStarOutcome = 'left' | 'shared' | 'remained' | 'delayed';

export interface HouseState {
  roomsEntered: HouseRoomId[];
  keeperRoomConversations: HouseRoomId[];
  firstObservation: HouseObservation | null;
  portraitSubject: PortraitSubject | null;
  portraitCommented: boolean;
  breadInterpretation: BreadInterpretation | null;
  toyInterpretation: ToyInterpretation | null;
  keeperMet: boolean;
  keeperIntroductionStep: number;
  thresholdMothSpoken: boolean;
  mothHistoryHeard: boolean;
  sproutArrived: boolean;
  sproutSpoken: boolean;
  photographDiscovered: boolean;
  photographBelief: PhotographBelief | null;
  starStatement: StarStatement | null;
  starOutcome: HouseStarOutcome | null;
  unkeptDiscovered: boolean;
  leafPlanted: boolean;
  exitOpened: boolean;
  complete: boolean;
}

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
    mothBeforeStarStep: number;
    mothPondResponseHeard: boolean;
    mothAfterStarStep: number;
    sproutSpoken: boolean;
    pondExamined: boolean;
    starDiscovered: boolean;
    starTaken: boolean;
    consequenceResolved: boolean;
    whiteFlower: boolean;
    archUnlocked: boolean;
    complete: boolean;
  };
  house: HouseState;
  preferences: {
    muted: boolean;
    reducedMotion: boolean;
    textSpeed: 'slow' | 'normal' | 'fast';
  };
  playtimeSeconds: number;
}

export type StateListener = (state: Readonly<MoonveilState>) => void;

export function createDefaultHouseState(): HouseState {
  return {
    roomsEntered: [],
    keeperRoomConversations: [],
    firstObservation: null,
    portraitSubject: null,
    portraitCommented: false,
    breadInterpretation: null,
    toyInterpretation: null,
    keeperMet: false,
    keeperIntroductionStep: 0,
    thresholdMothSpoken: false,
    mothHistoryHeard: false,
    sproutArrived: false,
    sproutSpoken: false,
    photographDiscovered: false,
    photographBelief: null,
    starStatement: null,
    starOutcome: null,
    unkeptDiscovered: false,
    leafPlanted: false,
    exitOpened: false,
    complete: false,
  };
}

export function portraitSubjectFor(observation: HouseObservation): PortraitSubject {
  if (observation === 'portrait') return 'woman';
  if (observation === 'window') return 'empty-chair';
  return 'dreamer';
}

export function starOutcomeFor(statement: StarStatement): HouseStarOutcome {
  if (statement === 'outside-unknown') return 'left';
  if (statement === 'house-changing') return 'shared';
  if (statement === 'safe-here') return 'remained';
  return 'delayed';
}

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
      mothBeforeStarStep: 0,
      mothPondResponseHeard: false,
      mothAfterStarStep: 0,
      sproutSpoken: false,
      pondExamined: false,
      starDiscovered: false,
      starTaken: false,
      consequenceResolved: false,
      whiteFlower: false,
      archUnlocked: false,
      complete: false,
    },
    house: createDefaultHouseState(),
    preferences: {
      muted: false,
      reducedMotion: false,
      textSpeed: 'normal',
    },
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

  advanceGardenMothBeforeStar(): void {
    this.state.garden.mothSpoken = true;
    this.state.garden.mothBeforeStarStep = Math.min(4, this.state.garden.mothBeforeStarStep + 1);
    this.emit();
  }

  markGardenMothPondResponse(): void {
    this.state.garden.mothSpoken = true;
    this.state.garden.mothPondResponseHeard = true;
    this.emit();
  }

  advanceGardenMothAfterStar(): void {
    this.state.garden.mothSpoken = true;
    this.state.garden.mothAfterStarStep = Math.min(3, this.state.garden.mothAfterStarStep + 1);
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

  enterHouseRoom(room: HouseRoomId): void {
    if (this.state.house.roomsEntered.includes(room)) return;
    this.state.house.roomsEntered.push(room);
    this.emit();
  }

  advanceKeeperIntroduction(totalSteps: number): void {
    if (this.state.house.keeperIntroductionStep >= totalSteps) return;
    this.state.house.keeperIntroductionStep += 1;
    if (!this.state.house.keeperMet) this.state.house.keeperMet = true;
    this.emit();
  }

  markThresholdMothSpoken(): boolean {
    if (this.state.house.thresholdMothSpoken) return false;
    this.state.house.thresholdMothSpoken = true;
    this.emit();
    return true;
  }

  markKeeperRoomConversation(room: HouseRoomId): boolean {
    if (this.state.house.keeperRoomConversations.includes(room)) return false;
    this.state.house.keeperRoomConversations.push(room);
    this.emit();
    return true;
  }

  observeHouseFirst(object: HouseObservation): PortraitSubject {
    if (this.state.house.firstObservation && this.state.house.portraitSubject) {
      return this.state.house.portraitSubject;
    }
    const subject = portraitSubjectFor(object);
    this.state.house.firstObservation = object;
    this.state.house.portraitSubject = subject;
    this.emit();
    return subject;
  }

  markPortraitCommented(): boolean {
    if (this.state.house.portraitCommented) return false;
    this.state.house.portraitCommented = true;
    this.emit();
    return true;
  }

  resolveBreadAssociation(interpretation: BreadInterpretation): boolean {
    if (this.state.house.breadInterpretation) return false;
    this.state.house.breadInterpretation = interpretation;
    this.arriveSprout();
    this.updateUnkeptDiscovery();
    this.emit();
    return true;
  }

  resolveToyAssociation(interpretation: ToyInterpretation): boolean {
    if (this.state.house.toyInterpretation) return false;
    this.state.house.toyInterpretation = interpretation;
    this.arriveSprout();
    this.updateUnkeptDiscovery();
    this.emit();
    return true;
  }

  markMothHistoryHeard(): boolean {
    if (this.state.house.mothHistoryHeard) return false;
    this.state.house.mothHistoryHeard = true;
    this.emit();
    return true;
  }

  markSproutSpoken(): boolean {
    if (this.state.house.sproutSpoken) return false;
    this.state.house.sproutSpoken = true;
    this.emit();
    return true;
  }

  discoverHousePhotograph(): boolean {
    if (this.state.house.photographDiscovered) return false;
    this.state.house.photographDiscovered = true;
    this.emit();
    return true;
  }

  setPhotographBelief(belief: PhotographBelief): boolean {
    if (this.state.house.photographBelief) return false;
    this.state.house.photographBelief = belief;
    this.emit();
    return true;
  }

  resolveHouseStar(statement: StarStatement): HouseStarOutcome {
    if (this.state.house.starOutcome) return this.state.house.starOutcome;
    const outcome = starOutcomeFor(statement);
    this.state.house.starStatement = statement;
    this.state.house.starOutcome = outcome;
    this.updateUnkeptDiscovery();
    this.emit();
    return outcome;
  }

  plantHouseLeaf(): boolean {
    if (this.state.house.leafPlanted) return false;
    this.state.house.leafPlanted = true;
    this.state.house.exitOpened = true;
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

  completeSlice(nextScene: SceneName, position: Position): void {
    this.state.garden.complete = true;
    this.state.currentScene = nextScene;
    this.state.lastSafe = { scene: nextScene, position: { ...position } };
    this.emit();
  }

  completeHouse(): void {
    if (this.state.house.complete) return;
    this.state.house.complete = true;
    this.state.currentScene = SceneId.SliceEnd;
    this.state.lastSafe = { scene: SceneId.SliceEnd, position: { x: 160, y: 90 } };
    this.emit();
  }

  addPlaytime(seconds: number): void {
    if (Number.isFinite(seconds) && seconds > 0) this.state.playtimeSeconds += seconds;
  }

  private arriveSprout(): void {
    const house = this.state.house;
    house.sproutArrived = Boolean(house.breadInterpretation && house.toyInterpretation);
  }

  private updateUnkeptDiscovery(): void {
    const house = this.state.house;
    if (house.breadInterpretation && house.toyInterpretation && house.starOutcome) {
      house.unkeptDiscovered = true;
    }
  }

  private emit(): void {
    const snapshot = this.snapshot;
    this.listeners.forEach((listener) => listener(snapshot));
  }
}
