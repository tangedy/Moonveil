import type { MothQuestion } from '../state/GameState';
import type { DialoguePage } from '../ui/DialogueOverlay';

export const chairFirst: DialoguePage[] = [
  { text: 'It is facing the wrong way.' },
  { text: "You don't know what the right way would be." },
];

export const chairFlower: DialoguePage[] = [
  { text: "You don't remember leaving this here." },
];

export const chairTurned: DialoguePage[] = [
  { text: 'It has corrected itself.' },
  { text: 'You cannot remember which way was wrong.' },
];

export const mothGreeting: DialoguePage[] = [
  { speaker: 'Moth', text: 'There you are.' },
  { speaker: 'Moth', text: 'You took so long that I arrived first.' },
];

export const mothQuestions: Record<MothQuestion, { label: string; answer: DialoguePage[] }> = {
  where: {
    label: 'Where is this?',
    answer: [{ speaker: 'Moth', text: 'Somewhere that misses you.' }],
  },
  moth: {
    label: 'Who are you?',
    answer: [{ speaker: 'Moth', text: 'I was hoping you knew.' }],
  },
  self: {
    label: 'Who am I?',
    answer: [{ speaker: 'Moth', text: 'Careful. Something might hear you.' }],
  },
};

export const pathAppears: DialoguePage[] = [
  { speaker: 'Moth', text: 'Oh.' },
  { speaker: 'Moth', text: 'It heard the shape of the question.' },
];
