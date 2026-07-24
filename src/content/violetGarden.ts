import type { DialoguePage } from '../ui/DialogueOverlay';

export const gardenDialogue = {
  mothBefore: [
    { speaker: 'Moth', text: 'Oh! A visitor wearing their shadow inside-out.' },
    { speaker: 'Moth', text: 'The moon dropped something near the quiet pond.' },
    { speaker: 'Moth', text: "If you find it, don't let it remember your name." },
  ] satisfies DialoguePage[],
  mothRepeat: [
    { speaker: 'DREAMER', text: 'Have I been here before?' },
    { speaker: 'Moth', text: 'Not this time.' },
  ] satisfies DialoguePage[],
  mothAfter: [
    { speaker: 'Moth', text: 'Oh.' },
    { speaker: 'Moth', text: 'Something recognized you.' },
  ] satisfies DialoguePage[],
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
