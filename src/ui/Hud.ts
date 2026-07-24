import type { AudioManager } from '../audio/AudioManager';
import type { GameStateStore } from '../state/GameState';
import type { SaveService } from '../state/SaveService';
import { formatSteps } from '../systems/StepCounter';

export class Hud {
  private readonly root = this.getElement<HTMLElement>('hud');
  private readonly counter = this.getElement<HTMLElement>('step-counter');
  private readonly help = this.getElement<HTMLElement>('help');
  private readonly message = this.getElement<HTMLElement>('hud-message');
  private readonly mute = this.getElement<HTMLButtonElement>('mute-toggle');
  private readonly motion = this.getElement<HTMLButtonElement>('motion-toggle');
  private messageTimer: number | null = null;

  constructor(
    private readonly store: GameStateStore,
    private readonly saves: SaveService,
    private readonly audio: AudioManager,
  ) {
    this.store.subscribe((state) => {
      this.counter.textContent = formatSteps(state.steps);
      this.mute.setAttribute('aria-pressed', String(state.preferences.muted));
      this.mute.textContent = state.preferences.muted ? 'MUTED' : 'SOUND';
      this.motion.setAttribute('aria-pressed', String(state.preferences.reducedMotion));
      this.motion.textContent = state.preferences.reducedMotion ? 'STILL' : 'CALM';
    });

    this.mute.addEventListener('click', () => {
      const next = !this.store.snapshot.preferences.muted;
      this.store.setPreference('muted', next);
      this.audio.setMuted(next);
      this.saves.save(this.store.snapshot);
    });

    this.motion.addEventListener('click', () => {
      const next = !this.store.snapshot.preferences.reducedMotion;
      this.store.setPreference('reducedMotion', next);
      this.saves.save(this.store.snapshot);
    });
  }

  show(visible = true): void {
    this.root.classList.toggle('is-hidden', !visible);
  }

  showHelp(): void {
    this.help.classList.remove('is-hidden');
    this.help.getAnimations().forEach((animation) => {
      animation.cancel();
      animation.play();
    });
  }

  hideHelp(): void {
    this.help.classList.add('is-hidden');
  }

  showMessage(text: string, duration = 2600): void {
    if (this.messageTimer !== null) window.clearTimeout(this.messageTimer);
    this.message.textContent = text;
    this.message.classList.remove('is-hidden', 'hud-message-showing');
    void this.message.offsetWidth;
    this.message.classList.add('hud-message-showing');
    this.messageTimer = window.setTimeout(() => {
      this.message.classList.add('is-hidden');
      this.message.classList.remove('hud-message-showing');
      this.messageTimer = null;
    }, duration);
  }

  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing UI element #${id}`);
    return element as T;
  }
}
