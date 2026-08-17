import type Phaser from 'phaser';
import { AudioCue, type AudioCue as Cue } from '../game/config';
import menuThemeUrl from './music/as the moon gazes down upon your weary eyes - keys (128k).mp3';

interface ToneDefinition {
  frequency: number;
  duration: number;
  volume: number;
  type: OscillatorType;
}

type VolumeSound = Phaser.Sound.BaseSound & {
  setVolume(value: number): Phaser.Sound.BaseSound;
};

const toneDefinitions: Partial<Record<Cue, ToneDefinition>> = {
  [AudioCue.Step]: { frequency: 72, duration: 0.035, volume: 0.018, type: 'square' },
  [AudioCue.MenuSelect]: { frequency: 659.25, duration: 0.26, volume: 0.034, type: 'triangle' },
  [AudioCue.DialogueMoth]: { frequency: 390, duration: 0.035, volume: 0.018, type: 'sine' },
  [AudioCue.DialogueSprout]: { frequency: 545, duration: 0.03, volume: 0.014, type: 'triangle' },
  [AudioCue.DialogueKeeper]: { frequency: 185, duration: 0.045, volume: 0.014, type: 'triangle' },
  [AudioCue.DialogueWorld]: { frequency: 245, duration: 0.04, volume: 0.014, type: 'sine' },
  [AudioCue.Loop]: { frequency: 110, duration: 0.32, volume: 0.035, type: 'sine' },
  [AudioCue.Path]: { frequency: 330, duration: 0.7, volume: 0.03, type: 'triangle' },
  [AudioCue.StarTake]: { frequency: 620, duration: 0.85, volume: 0.04, type: 'sine' },
  [AudioCue.PassageMemory]: { frequency: 262, duration: 0.62, volume: 0.026, type: 'sine' },
  [AudioCue.Photograph]: { frequency: 466, duration: 0.75, volume: 0.025, type: 'triangle' },
  [AudioCue.PlantGrowth]: { frequency: 294, duration: 0.9, volume: 0.028, type: 'sine' },
};

export class AudioManager {
  private context: AudioContext | null = null;
  private scene: Phaser.Scene | null = null;
  private muted = false;
  private lastDialogueTick = 0;
  private ambienceNodes: OscillatorNode[] = [];
  private ambienceGains: GainNode[] = [];
  private ambienceTargets: number[] = [];
  private menuElement: HTMLAudioElement | null = null;
  private menuDesired = false;
  private gestureArmed = false;
  private readonly onUserGesture = (): void => {
    void this.unlock();
    if (this.menuDesired) this.startMenuMusic();
  };
  private gardenSound: VolumeSound | null = null;
  private houseSound: VolumeSound | null = null;
  private houseAmbienceActive = false;
  private starSound: VolumeSound | null = null;
  private starVolume = 0;
  private gardenVolume = 0.16;
  private currentGardenVolume = 0.16;
  private starOscillator: OscillatorNode | null = null;
  private starGain: GainNode | null = null;

  attach(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  async unlock(): Promise<void> {
    await this.resumeContext(this.ensureContext());
    const phaserSound = this.scene?.sound as unknown as { context?: AudioContext; unlock?: () => void } | undefined;
    if (phaserSound?.context) await this.resumeContext(phaserSound.context);
    phaserSound?.unlock?.();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.ambienceGains.forEach((gain, index) => {
      gain.gain.setTargetAtTime(muted ? 0 : (this.ambienceTargets[index] ?? 0.003), gain.context.currentTime, 0.08);
    });
    if (this.menuElement) this.menuElement.volume = muted ? 0 : 0.38;
    this.gardenSound?.setVolume(muted ? 0 : this.currentGardenVolume);
    this.houseSound?.setVolume(muted ? 0 : 0.14);
    this.starSound?.setVolume(muted ? 0 : this.starVolume);
    if (this.starGain) this.starGain.gain.setTargetAtTime(muted ? 0 : this.starVolume, this.starGain.context.currentTime, 0.05);
    if (!muted && this.menuDesired) this.startMenuMusic();
  }

  cue(cue: Cue): void {
    if (this.muted) return;
    const overrideKey = `override-audio:${cue}`;
    if (this.scene?.cache.audio.exists(overrideKey)) {
      this.scene.sound.play(overrideKey, { volume: 0.3 });
      return;
    }

    const definition = toneDefinitions[cue];
    if (!definition || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = definition.type;
    oscillator.frequency.setValueAtTime(definition.frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, definition.frequency * 0.72), now + definition.duration);
    gain.gain.setValueAtTime(definition.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + definition.duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + definition.duration);
  }

  dialogueTick(speaker?: string): void {
    const now = performance.now();
    if (now - this.lastDialogueTick < 45) return;
    this.lastDialogueTick = now;
    const normalized = speaker?.toLowerCase();
    const cue = normalized === 'moth'
      ? AudioCue.DialogueMoth
      : normalized === 'sprout'
        ? AudioCue.DialogueSprout
        : normalized === 'keeper'
          ? AudioCue.DialogueKeeper
          : AudioCue.DialogueWorld;
    this.cue(cue);
  }

  startMenuMusic(): void {
    this.menuDesired = true;
    this.stopGameplayAmbience();
    const element = this.ensureMenuElement();
    if (!element) return;
    element.volume = this.muted ? 0 : 0.38;
    if (!element.paused) {
      this.disarmGestureUnlock();
      return;
    }
    void this.tryPlayMenu(element);
  }

  startGardenAmbience(): void {
    this.stopAmbience();
    const overrideKey = `override-audio:${AudioCue.Garden}`;
    if (this.scene?.cache.audio.exists(overrideKey)) {
      this.gardenSound = this.scene.sound.add(overrideKey, { loop: true, volume: this.muted ? 0 : this.currentGardenVolume }) as VolumeSound;
      this.gardenSound.play();
      return;
    }
    if (!this.context) return;
    [98, 147].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const target = index === 0 ? 0.006 : 0.003;
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.value = this.muted ? 0 : target;
      oscillator.connect(gain).connect(this.context!.destination);
      oscillator.start();
      this.ambienceNodes.push(oscillator);
      this.ambienceGains.push(gain);
      this.ambienceTargets.push(target);
    });
  }

  startHouseAmbience(): void {
    if (this.houseAmbienceActive && (this.houseSound?.isPlaying || this.ambienceNodes.length > 0)) return;
    this.stopAmbience();
    const overrideKey = `override-audio:${AudioCue.House}`;
    if (this.scene?.cache.audio.exists(overrideKey)) {
      this.houseSound = this.scene.sound.add(overrideKey, { loop: true, volume: this.muted ? 0 : 0.14 }) as VolumeSound;
      this.houseSound.play();
      this.houseAmbienceActive = true;
      return;
    }
    if (!this.context) return;
    [65.41, 98.0, 130.81].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const gain = this.context!.createGain();
      const target = index === 0 ? 0.0045 : index === 1 ? 0.0022 : 0.0012;
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = this.muted ? 0 : target;
      oscillator.connect(gain).connect(this.context!.destination);
      oscillator.start();
      this.ambienceNodes.push(oscillator);
      this.ambienceGains.push(gain);
      this.ambienceTargets.push(target);
    });
    this.houseAmbienceActive = true;
  }

  startStarHum(): void {
    const overrideKey = `override-audio:${AudioCue.StarHum}`;
    if (this.scene?.cache.audio.exists(overrideKey)) {
      this.starSound = this.scene.sound.add(overrideKey, { loop: true, volume: 0 }) as VolumeSound;
      this.starSound.play();
      return;
    }
    if (!this.context || this.starOscillator) return;
    this.starOscillator = this.context.createOscillator();
    this.starGain = this.context.createGain();
    this.starOscillator.type = 'sine';
    this.starOscillator.frequency.value = 523.25;
    this.starGain.gain.value = 0;
    this.starOscillator.connect(this.starGain).connect(this.context.destination);
    this.starOscillator.start();
  }

  setStarDistance(distance: number): void {
    const volume = Math.max(0, Math.min(0.022, (150 - distance) / 150 * 0.022));
    this.starVolume = volume;
    this.starSound?.setVolume(this.muted ? 0 : Math.min(0.3, volume * 10));
    if (this.starGain) this.starGain.gain.setTargetAtTime(this.muted ? 0 : volume, this.starGain.context.currentTime, 0.08);
  }

  setGardenDistance(distance: number): void {
    const quietRadius = 20;
    const fullRadius = 150;
    const clamped = Math.min(1, Math.max(0, (distance - quietRadius) / (fullRadius - quietRadius)));
    const volume = clamped * this.gardenVolume;
    this.currentGardenVolume = volume;
    this.gardenSound?.setVolume(this.muted ? 0 : volume);
  }

  restoreGardenVolume(): void {
    this.currentGardenVolume = this.gardenVolume;
    this.gardenSound?.setVolume(this.muted ? 0 : this.gardenVolume);
  }

  stopStarHum(): void {
    this.starSound?.stop();
    this.starSound?.destroy();
    this.starSound = null;
    this.starOscillator?.stop();
    this.starOscillator?.disconnect();
    this.starGain?.disconnect();
    this.starOscillator = null;
    this.starGain = null;
  }

  stopAmbience(): void {
    this.menuDesired = false;
    this.stopMenuMusic();
    this.stopGameplayAmbience();
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;
      this.context = new AudioContextConstructor();
    }
    return this.context;
  }

  private async resumeContext(context: AudioContext): Promise<void> {
    if (context.state !== 'suspended') return;
    try {
      await context.resume();
    } catch {
      // Browsers reject resume() until they have a user gesture.
    }
  }

  private ensureMenuElement(): HTMLAudioElement | null {
    if (this.menuElement) return this.menuElement;
    if (typeof Audio === 'undefined') return null;
    const element = new Audio(menuThemeUrl);
    element.loop = true;
    element.autoplay = true;
    element.preload = 'auto';
    element.setAttribute('playsinline', '');
    element.setAttribute('aria-hidden', 'true');
    element.volume = this.muted ? 0 : 0.38;
    if (typeof document !== 'undefined') document.body?.appendChild(element);
    this.menuElement = element;
    return element;
  }

  private async tryPlayMenu(element: HTMLAudioElement): Promise<void> {
    if (this.muted) return;
    try {
      await element.play();
      this.disarmGestureUnlock();
    } catch {
      this.armGestureUnlock();
    }
  }

  private armGestureUnlock(): void {
    if (this.gestureArmed || typeof window === 'undefined') return;
    this.gestureArmed = true;
    for (const event of ['pointerdown', 'keydown', 'touchstart'] as const) {
      window.addEventListener(event, this.onUserGesture, { capture: true });
    }
  }

  private disarmGestureUnlock(): void {
    if (!this.gestureArmed || typeof window === 'undefined') return;
    this.gestureArmed = false;
    for (const event of ['pointerdown', 'keydown', 'touchstart'] as const) {
      window.removeEventListener(event, this.onUserGesture, { capture: true });
    }
  }

  private stopMenuMusic(): void {
    this.disarmGestureUnlock();
    if (!this.menuElement) return;
    this.menuElement.pause();
    this.menuElement.currentTime = 0;
  }

  private stopGameplayAmbience(): void {
    this.gardenSound?.stop();
    this.gardenSound?.destroy();
    this.gardenSound = null;
    this.houseSound?.stop();
    this.houseSound?.destroy();
    this.houseSound = null;
    this.houseAmbienceActive = false;
    this.ambienceNodes.forEach((node) => {
      node.stop();
      node.disconnect();
    });
    this.ambienceGains.forEach((gain) => gain.disconnect());
    this.ambienceNodes = [];
    this.ambienceGains = [];
    this.ambienceTargets = [];
    this.stopStarHum();
  }
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
