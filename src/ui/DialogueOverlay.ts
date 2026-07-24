export interface DialoguePage {
  speaker?: string;
  text: string;
}

export interface DialogueChoice {
  id: string;
  label: string;
}

export interface DialoguePreferences {
  textSpeed: 'slow' | 'normal' | 'fast';
  reducedMotion: boolean;
}

export class DialogueOverlay {
  private readonly root = this.getElement<HTMLElement>('dialogue');
  private readonly speaker = this.getElement<HTMLElement>('speaker');
  private readonly text = this.getElement<HTMLElement>('dialogue-text');
  private readonly choices = this.getElement<HTMLElement>('dialogue-choices');
  private readonly continueMark = this.getElement<HTMLElement>('continue-mark');
  private typingTimer: number | null = null;

  constructor(private readonly onGlyph?: (speaker: string | undefined) => void) {}

  async show(
    page: DialoguePage,
    preferences: DialoguePreferences,
    choices: readonly DialogueChoice[] = [],
    closeAfter = true,
  ): Promise<string | undefined> {
    this.cancelTyping();
    this.root.classList.remove('is-hidden');
    this.speaker.textContent = page.speaker ?? '';
    this.text.textContent = '';
    this.choices.replaceChildren();
    this.continueMark.classList.add('is-hidden');
    this.root.classList.toggle('has-choices', choices.length > 0);

    const delay = preferences.textSpeed === 'slow' ? 38 : preferences.textSpeed === 'fast' ? 12 : 24;
    let characterIndex = preferences.reducedMotion ? page.text.length : 0;
    let typing = characterIndex < page.text.length;
    let selectedIndex = 0;
    const openedAt = performance.now();

    const renderChoices = (): void => {
      this.choices.replaceChildren();
      choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice-button';
        button.dataset.choice = choice.id;
        button.textContent = choice.label;
        button.setAttribute('aria-selected', String(index === selectedIndex));
        button.addEventListener('mouseenter', () => {
          selectedIndex = index;
          updateSelection();
        });
        this.choices.append(button);
      });
      updateSelection();
    };

    const updateSelection = (): void => {
      const buttons = [...this.choices.querySelectorAll<HTMLButtonElement>('.choice-button')];
      buttons.forEach((button, index) => button.setAttribute('aria-selected', String(index === selectedIndex)));
      buttons[selectedIndex]?.focus({ preventScroll: true });
    };

    const finishTyping = (): void => {
      characterIndex = page.text.length;
      this.text.textContent = page.text;
      typing = false;
      this.cancelTyping();
      if (choices.length > 0) renderChoices();
      else this.continueMark.classList.remove('is-hidden');
    };

    if (typing) {
      this.typingTimer = window.setInterval(() => {
        characterIndex += 1;
        this.text.textContent = page.text.slice(0, characterIndex);
        const glyph = page.text[characterIndex - 1];
        if (glyph && /[A-Za-z0-9]/.test(glyph) && characterIndex % 3 === 0) this.onGlyph?.(page.speaker);
        if (characterIndex >= page.text.length) finishTyping();
      }, delay);
    } else {
      this.text.textContent = page.text;
      if (choices.length > 0) renderChoices();
      else this.continueMark.classList.remove('is-hidden');
    }

    return new Promise<string | undefined>((resolve) => {
      const cleanup = (result?: string): void => {
        this.cancelTyping();
        window.removeEventListener('keydown', onKeyDown, true);
        this.root.removeEventListener('click', onClick);
        if (closeAfter) this.root.classList.add('is-hidden');
        this.choices.replaceChildren();
        this.root.classList.remove('has-choices');
        resolve(result);
      };

      const choose = (): void => {
        const choice = choices[selectedIndex];
        if (choice) cleanup(choice.id);
      };

      const advance = (): void => {
        if (performance.now() - openedAt < 110) return;
        if (typing) finishTyping();
        else if (choices.length > 0) choose();
        else cleanup();
      };

      const onKeyDown = (event: KeyboardEvent): void => {
        if (['ArrowUp', 'ArrowDown', 'Enter', ' ', 'z', 'Z'].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (!typing && choices.length > 0 && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          selectedIndex = (selectedIndex + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
          updateSelection();
          return;
        }
        if (event.key === 'Enter' || event.key === ' ' || event.key.toLowerCase() === 'z') advance();
      };

      const onClick = (event: MouseEvent): void => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-choice]');
        if (button) {
          const index = choices.findIndex((choice) => choice.id === button.dataset.choice);
          if (index >= 0) selectedIndex = index;
        }
        advance();
      };

      window.addEventListener('keydown', onKeyDown, true);
      this.root.addEventListener('click', onClick);
    });
  }

  hide(): void {
    this.cancelTyping();
    this.root.classList.add('is-hidden');
    this.root.classList.remove('has-choices');
    this.choices.replaceChildren();
  }

  private cancelTyping(): void {
    if (this.typingTimer !== null) {
      window.clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }

  private getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing UI element #${id}`);
    return element as T;
  }
}
