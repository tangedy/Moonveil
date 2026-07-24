import type { MoonveilState } from '../state/GameState';

interface InventoryContext {
  canOpen: () => boolean;
  onVisibilityChange: (open: boolean) => void;
}

interface InventoryItem {
  icon: string;
  name: string;
  description: string;
}

export class InventoryOverlay {
  private readonly root = this.getElement<HTMLElement>('inventory');
  private readonly panel = this.getElement<HTMLElement>('inventory-panel');
  private readonly items = this.getElement<HTMLElement>('inventory-items');
  private readonly closeButton = this.getElement<HTMLButtonElement>('inventory-close');
  private context: InventoryContext | null = null;
  private closeTimer: number | null = null;

  constructor(private readonly getState: () => Readonly<MoonveilState>) {
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    this.panel.addEventListener('click', (event) => event.stopPropagation());
    this.closeButton.addEventListener('click', () => this.close());
  }

  attach(context: InventoryContext): void {
    this.context = context;
  }

  detach(): void {
    this.context = null;
    this.close(true);
  }

  get isOpen(): boolean {
    return !this.root.classList.contains('is-hidden');
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.repeat || this.isEditableTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === 'i') {
      if (!this.isOpen && !this.context?.canOpen()) return;
      event.preventDefault();
      this.toggle();
      return;
    }
    if (this.isOpen && (key === 'escape' || key === 'x')) {
      event.preventDefault();
      this.close();
    }
  }

  private toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  private open(): void {
    if (!this.context?.canOpen()) return;
    this.cancelClose();
    this.renderItems();
    this.root.classList.remove('is-hidden', 'inventory-closing');
    this.root.classList.add('inventory-opening');
    this.root.setAttribute('aria-hidden', 'false');
    this.context.onVisibilityChange(true);
    this.closeButton.focus({ preventScroll: true });
  }

  private close(immediate = false): void {
    if (!this.isOpen) return;
    this.cancelClose();
    const reducedMotion = this.getState().preferences.reducedMotion;
    if (immediate || reducedMotion) {
      this.finishClose();
      return;
    }
    this.root.classList.remove('inventory-opening');
    this.root.classList.add('inventory-closing');
    this.closeTimer = window.setTimeout(() => this.finishClose(), 180);
  }

  private finishClose(): void {
    this.cancelClose();
    this.root.classList.add('is-hidden');
    this.root.classList.remove('inventory-opening', 'inventory-closing');
    this.root.setAttribute('aria-hidden', 'true');
    this.context?.onVisibilityChange(false);
  }

  private renderItems(): void {
    const state = this.getState();
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
