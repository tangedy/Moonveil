export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 180;

export const PROLOGUE_GEOMETRY = {
  worldWidth: 640,
  worldHeight: 360,
  roomOffsetX: 160,
  roomOffsetY: 90,
  spawnX: 320,
  spawnY: 208,
  wrapMargin: 8,
  wrapInset: 10,
  pathExitX: 480,
  pathMinY: 171,
  pathMaxY: 222,
} as const;

export const PALETTE = {
  ink: 0x08050d,
  black: 0x000000,
  paper: 0xfffaf2,
  violet: 0x8d5bc9,
  violetLight: 0xc9a7f2,
  violetDark: 0x3b2258,
  violetDeep: 0x1d102b,
} as const;

export const MOVEMENT = {
  speed: 72,
  sprintSpeed: 118,
  bodyWidth: 8,
  bodyHeight: 7,
  bodyOffsetX: 4,
  bodyOffsetY: 12,
  interactionRange: 27,
  strideLength: 10,
} as const;

export const SAVE_KEY = 'moonveil.save.v1';
export const SAVE_SCHEMA_VERSION = 2 as const;

export const SceneId = {
  Boot: 'Boot',
  Launch: 'Launch',
  Prologue: 'Prologue',
  VioletGarden: 'VioletGarden',
  SliceEnd: 'SliceEnd',
} as const;

export type SceneId = (typeof SceneId)[keyof typeof SceneId];

export const Facing = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
} as const;

export type Facing = (typeof Facing)[keyof typeof Facing];

export const TextureKey = {
  DreamerDown0: 'dreamer-down-0',
  DreamerDown1: 'dreamer-down-1',
  DreamerUp0: 'dreamer-up-0',
  DreamerUp1: 'dreamer-up-1',
  DreamerLeft0: 'dreamer-left-0',
  DreamerLeft1: 'dreamer-left-1',
  DreamerRight0: 'dreamer-right-0',
  DreamerRight1: 'dreamer-right-1',
  Chair: 'chair',
  Flower: 'flower',
  FlowerWhite: 'flower-white',
  Moth0: 'moth-0',
  Moth1: 'moth-1',
  Sprout0: 'sprout-0',
  Sprout1: 'sprout-1',
  Star0: 'star-0',
  Star1: 'star-1',
  ArchClosed: 'arch-closed',
  ArchOpen: 'arch-open',
} as const;

export type TextureKey = (typeof TextureKey)[keyof typeof TextureKey];

export const AudioCue = {
  Step: 'step',
  DialogueMoth: 'dialogue-moth',
  DialogueSprout: 'dialogue-sprout',
  DialogueWorld: 'dialogue-world',
  Loop: 'loop',
  Path: 'path',
  StarHum: 'star-hum',
  StarTake: 'star-take',
  Garden: 'garden',
} as const;

export type AudioCue = (typeof AudioCue)[keyof typeof AudioCue];
