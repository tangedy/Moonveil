import type { DialoguePage } from '../ui/DialogueOverlay';

export const gardenDialogue = {
  mothBeforeStar: [
    [
      { speaker: 'Moth', text: 'Welcome back to the Violet Garden.' },
      { speaker: 'DREAMER', text: 'Back?' },
      { speaker: 'Moth', text: 'Welcome, then.' },
      { speaker: 'Moth', text: 'The garden has always been sentimental.' },
    ],
    [
      { speaker: 'Moth', text: 'Try not to step on the violets.' },
      { speaker: 'DREAMER', text: 'I don’t see any violets.' },
      { speaker: 'Moth', text: 'They remember you taller.' },
    ],
    [
      { speaker: 'Moth', text: 'You’re looking for something.' },
      { speaker: 'DREAMER', text: 'Am I?' },
      { speaker: 'Moth', text: 'You have the posture for it.' },
    ],
    [
      { speaker: 'Moth', text: 'Something fell near the quiet water.' },
      { speaker: 'DREAMER', text: 'How do you know?' },
      { speaker: 'Moth', text: 'The pond has been pretending not to look at it.' },
    ],
  ] satisfies DialoguePage[][],
  mothAfterPond: [
    { speaker: 'DREAMER', text: 'My reflection moved.' },
    { speaker: 'Moth', text: 'Reflections do that.' },
    { speaker: 'DREAMER', text: 'Before I did.' },
    { speaker: 'Moth', text: 'Some are more experienced.' },
  ] satisfies DialoguePage[],
  mothAfterStar: [
    [
      { speaker: 'DREAMER', text: 'Everything feels familiar.' },
      { speaker: 'Moth', text: 'Familiarity is only strangeness that knows your name.' },
    ],
    [
      { speaker: 'DREAMER', text: 'Have I been here before?' },
      { speaker: 'Moth', text: 'Not this time.' },
    ],
    [
      { speaker: 'DREAMER', text: 'What am I supposed to do here?' },
      { speaker: 'Moth', text: 'You’ve only just arrived.' },
      { speaker: 'Moth', text: 'It would be rude for the world to start demanding things already.' },
    ],
  ] satisfies DialoguePage[][],
  sproutBefore: [
    { speaker: 'Sprout', text: '…' },
    { speaker: 'Sprout', text: 'I am practicing being mysterious.' },
    { speaker: 'Sprout', text: 'Is it working?' },
  ] satisfies DialoguePage[],
  sproutRepeat: [
    { speaker: 'Sprout', text: 'I have learned a forbidden secret.' },
    { speaker: 'DREAMER', text: 'What is it?' },
    { speaker: 'Sprout', text: "I'm not allowed to tell you." },
    { speaker: 'DREAMER', text: 'Who forbade you?' },
    { speaker: 'Sprout', text: 'You did. Just now. It was implied.' },
  ] satisfies DialoguePage[],
  sproutAfter: [
    { speaker: 'Sprout', text: "You're looking at me differently." },
    { speaker: 'Sprout', text: 'Have we become acquaintances retroactively?' },
  ] satisfies DialoguePage[],
  pondFirst: [
    { text: 'Your reflection blinks first.' },
    { text: 'You decide not to mention it.' },
  ] satisfies DialoguePage[],
  pondRepeat: [
    { text: 'Your reflection blinks first.' },
    { text: 'It still does that.' },
  ] satisfies DialoguePage[],
  flower: [
    { text: 'A violet flower leans toward you.' },
    { text: 'There is no wind.' },
  ] satisfies DialoguePage[],
  whiteFlower: [
    { text: 'This flower has forgotten purple.' },
  ] satisfies DialoguePage[],
  star: [
    { text: 'A tiny star is sleeping in the grass.' },
    { text: 'It hums when you hold it close.' },
  ] satisfies DialoguePage[],
  starTaken: [
    { text: 'SLEEPING STAR' },
    { text: 'It dreams of the sky.' },
  ] satisfies DialoguePage[],
  archClosed: [
    { text: 'An arch made for a path that is not here.' },
  ] satisfies DialoguePage[],
  archOpen: [
    { text: 'Beyond the arch, something is becoming morning.' },
  ] satisfies DialoguePage[],
} as const;
