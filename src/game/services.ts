import { AssetRegistry } from '../assets/AssetRegistry';
import { AudioManager } from '../audio/AudioManager';
import { GameStateStore } from '../state/GameState';
import { SaveService } from '../state/SaveService';
import { DialogueSystem } from '../systems/DialogueSystem';
import { DialogueOverlay } from '../ui/DialogueOverlay';
import { Hud } from '../ui/Hud';

export const stateStore = new GameStateStore();
export const saveService = new SaveService();
export const audioManager = new AudioManager();
export const assetRegistry = new AssetRegistry();
export const dialogueOverlay = new DialogueOverlay((speaker) => audioManager.dialogueTick(speaker));
export const dialogueSystem = new DialogueSystem(dialogueOverlay, audioManager, () => stateStore.snapshot.preferences);
export const hud = new Hud(stateStore, saveService, audioManager);
