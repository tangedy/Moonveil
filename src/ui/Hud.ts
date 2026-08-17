export class Hud {
  private readonly message = this.getElement<HTMLElement>('hud-message');
  private messageTimer: number | null = null;

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
