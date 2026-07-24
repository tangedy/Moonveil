import type { AudioManager } from '../audio/AudioManager';
import type { MoonveilState } from '../state/GameState';
import type { DialogueChoice, DialogueOverlay, DialoguePage } from '../ui/DialogueOverlay';

export type DialoguePresenter = (
  pages: readonly DialoguePage[],
  choices?: readonly DialogueChoice[],
) => Promise<string | undefined>;

export class DialogueSystem {
  constructor(
    private readonly overlay: DialogueOverlay,
    private readonly audio: AudioManager,
    private readonly getPreferences: () => MoonveilState['preferences'],
  ) {}

  async run(
    pages: readonly DialoguePage[],
    setLocked: (locked: boolean) => void,
    choices: readonly DialogueChoice[] = [],
  ): Promise<string | undefined> {
    setLocked(true);
    try {
      return await this.present(pages, choices, true);
    } finally {
      setLocked(false);
    }
  }

  async conversation<T>(
    setLocked: (locked: boolean) => void,
    conduct: (present: DialoguePresenter) => Promise<T>,
  ): Promise<T> {
    setLocked(true);
    try {
      return await conduct((pages, choices = []) => this.present(pages, choices, false));
    } finally {
      await this.overlay.hide();
      setLocked(false);
    }
  }

  chirp(speaker?: string): void {
    this.audio.dialogueTick(speaker);
  }

  private async present(
    pages: readonly DialoguePage[],
    choices: readonly DialogueChoice[],
    closeAfter: boolean,
  ): Promise<string | undefined> {
    let result: string | undefined;
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      if (!page) continue;
      const isLast = index === pages.length - 1;
      result = await this.overlay.show(
        page,
        this.getPreferences(),
        isLast ? choices : [],
        closeAfter && isLast,
      );
    }
    return result;
  }
}
