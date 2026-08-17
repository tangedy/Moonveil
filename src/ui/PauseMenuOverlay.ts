import type { AudioManager } from '../audio/AudioManager';
import type { GameStateStore, MoonveilState } from '../state/GameState';
import type { SaveService } from '../state/SaveService';
import { formatSteps } from '../systems/StepCounter';

type PauseTab = 'inventory' | 'settings' | 'controls' | 'save';

interface PauseMenuContext {
  canOpen: () => boolean;
  onVisibilityChange: (open: boolean) => void;
  onSave: () => void;
  onLeaveGame: () => void;
}

interface InventoryItem {
  icon: string;
  name: string;
  description: string;
}

export class PauseMenuOverlay {
  private readonly root = this.getElement<HTMLElement>('pause-menu');
  private readonly panel = this.getElement<HTMLElement>('pause-panel');
  private readonly closeButton = this.getElement<HTMLButtonElement>('pause-close');
  private readonly stepCounter = this.getElement<HTMLElement>('pause-step-counter');
  private readonly items = this.getElement<HTMLElement>('inventory-items');
  private readonly soundToggle = this.getElement<HTMLButtonElement>('pause-sound-toggle');
  private readonly calmToggle = this.getElement<HTMLButtonElement>('pause-calm-toggle');
  private readonly saveButton = this.getElement<HTMLButtonElement>('pause-save');
  private readonly saveStatus = this.getElement<HTMLElement>('pause-save-status');
  private readonly leaveButton = this.getElement<HTMLButtonElement>('pause-leave');
  private readonly tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-pause-tab]'));
  private context: PauseMenuContext | null = null;
  private activeTab: PauseTab = 'inventory';
  private closeTimer: number | null = null;
  private leaving = false;

  constructor(
    private readonly store: GameStateStore,
    private readonly saves: SaveService,
    private readonly audio: AudioManager,
  ) {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    this.panel.addEventListener('click', (event) => event.stopPropagation());
    this.closeButton.addEventListener('click', () => this.close());
    this.soundToggle.addEventListener('click', () => this.toggleSound());
    this.calmToggle.addEventListener('click', () => this.toggleCalm());
    this.saveButton.addEventListener('click', () => this.saveGame());
    this.leaveButton.addEventListener('click', () => this.leaveGame());
    this.tabs.forEach((tab) => {
      const tabName = this.tabName(tab);
      tab.id = `pause-tab-${tabName}`;
      tab.setAttribute('aria-controls', `pause-panel-${tabName}`);
      tab.addEventListener('click', () => this.selectTab(tabName, true));
      tab.addEventListener('keydown', (event) => this.navigateTabs(event, tabName));
      const panel = this.getTabPanel(tabName);
      panel.setAttribute('aria-labelledby', tab.id);
    });
    this.store.subscribe((state) => this.syncState(state));
    this.selectTab(this.activeTab);
  }

  attach(context: PauseMenuContext): void {
    this.context = context;
  }

  detach(): void {
    this.context = null;
    this.leaving = false;
    this.close(true);
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('is-hidden');
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.repeat || this.isEditableTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') {
      if (!this.isOpen && !this.context?.canOpen()) return;
      event.preventDefault();
      if (this.isOpen) this.close();
      else this.open(this.activeTab);
      return;
    }
    if (key === 'i') {
      if (!this.isOpen && !this.context?.canOpen()) return;
      event.preventDefault();
      if (!this.isOpen) this.open('inventory');
      else if (this.activeTab === 'inventory') this.close();
      else this.selectTab('inventory', true);
    }
  }

  private open(tab: PauseTab): void {
    if (!this.context?.canOpen()) return;
    this.cancelClose();
    this.saveStatus.textContent = '';
    this.renderItems();
    this.selectTab(tab);
    this.root.classList.remove('is-hidden', 'pause-closing');
    this.root.classList.add('pause-opening');
    this.root.setAttribute('aria-hidden', 'false');
    this.context.onVisibilityChange(true);
    this.getTabButton(tab).focus({ preventScroll: true });
  }

  private close(immediate = false): void {
    if (!this.isOpen) return;
    this.cancelClose();
    const reducedMotion = this.store.snapshot.preferences.reducedMotion;
    if (immediate || reducedMotion) {
      this.finishClose();
      return;
    }
    this.root.classList.remove('pause-opening');
    this.root.classList.add('pause-closing');
    this.closeTimer = window.setTimeout(() => this.finishClose(), 180);
  }

  private finishClose(): void {
    this.cancelClose();
    this.root.classList.add('is-hidden');
    this.root.classList.remove('pause-opening', 'pause-closing');
    this.root.setAttribute('aria-hidden', 'true');
    this.context?.onVisibilityChange(false);
  }

  private selectTab(tab: PauseTab, focus = false): void {
    this.activeTab = tab;
    this.tabs.forEach((button) => {
      const selected = this.tabName(button) === tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    (['inventory', 'settings', 'controls', 'save'] as const).forEach((name) => {
      const selected = name === tab;
      const panel = this.getTabPanel(name);
      panel.classList.toggle('is-hidden', !selected);
      panel.hidden = !selected;
    });
    if (tab === 'inventory') this.renderItems();
    if (focus) this.getTabButton(tab).focus({ preventScroll: true });
  }

  private navigateTabs(event: KeyboardEvent, current: PauseTab): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const names: PauseTab[] = ['inventory', 'settings', 'controls', 'save'];
    const currentIndex = names.indexOf(current);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? names.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length;
    this.selectTab(names[nextIndex]!, true);
  }

  private toggleSound(): void {
    const next = !this.store.snapshot.preferences.muted;
    this.store.setPreference('muted', next);
    this.audio.setMuted(next);
    this.saves.save(this.store.snapshot);
  }

  private toggleCalm(): void {
    const next = !this.store.snapshot.preferences.reducedMotion;
    this.store.setPreference('reducedMotion', next);
    this.saves.save(this.store.snapshot);
  }

  private saveGame(): void {
    this.context?.onSave();
    this.saveStatus.textContent = 'THE DREAM IS HELD.';
  }

  private leaveGame(): void {
    if (!this.context || this.leaving) return;
    this.leaving = true;
    this.context.onSave();
    this.context.onLeaveGame();
  }

  private syncState(state: Readonly<MoonveilState>): void {
    this.stepCounter.textContent = formatSteps(state.steps);
    this.soundToggle.setAttribute('aria-pressed', String(!state.preferences.muted));
    this.soundToggle.textContent = state.preferences.muted ? 'OFF' : 'ON';
    this.calmToggle.setAttribute('aria-pressed', String(state.preferences.reducedMotion));
    this.calmToggle.textContent = state.preferences.reducedMotion ? 'ON' : 'OFF';
    if (this.isOpen && this.activeTab === 'inventory') this.renderItems();
  }

  private renderItems(): void {
    const state = this.store.snapshot;
    const inventory: InventoryItem[] = [
      { icon: '◆', name: 'Soft Candy', description: 'Still warm. Restores 5 HEART.' },
    ];
    if (state.garden.starTaken) {
      inventory.push({ icon: '★', name: 'Sleeping Star', description: 'It dreams of the sky.' });
    }
    if (state.house.starOutcome === 'left') {
      inventory.push({ icon: '✦', name: 'Photograph Star', description: 'It chose the room outside the picture.' });
    }
    if (state.house.starOutcome === 'shared') {
      inventory.push({ icon: '·', name: 'Shared Light', description: 'A reflection offered without leaving.' });
    }

    this.items.replaceChildren(...inventory.map((item) => {
      const row = document.createElement('div');
      row.className = 'inventory-item';
      const icon = document.createElement('span');
      icon.className = 'inventory-item-icon';
      icon.textContent = item.icon;
      const copy = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'inventory-item-name';
      name.textContent = item.name;
      const description = document.createElement('div');
      description.className = 'inventory-item-description';
      description.textContent = item.description;
      copy.append(name, description);
      row.append(icon, copy);
      return row;
    }));
  }

  private getTabButton(tab: PauseTab): HTMLButtonElement {
    const button = this.tabs.find((candidate) => this.tabName(candidate) === tab);
    if (!button) throw new Error(`Missing pause tab ${tab}`);
    return button;
  }

  private getTabPanel(tab: PauseTab): HTMLElement {
    return this.getElement<HTMLElement>(`pause-panel-${tab}`);
  }

  private tabName(button: HTMLButtonElement): PauseTab {
    return button.dataset.pauseTab as PauseTab;
  }

  private cancelClose(): void {
    if (this.closeTimer !== null) {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  }

  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing UI element #${id}`);
    return element as T;
  }
}
