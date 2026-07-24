import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __MOONVEIL__?: {
      state: () => {
        version: number;
        steps: { real: number };
        prologue: {
          loopCount: number;
          flowerRevealed: boolean;
          chairTurned: boolean;
          mothAppeared: boolean;
          askedQuestions: string[];
          pathRevealed: boolean;
        };
        garden: {
          pondExamined: boolean;
          starTaken: boolean;
        };
        preferences: { muted: boolean; reducedMotion: boolean };
      };
      scene: () => string;
      view: () => {
        player: { x: number; y: number; texture: string } | null;
        camera: { scrollX: number; scrollY: number } | null;
        reflection: { x: number; y: number; texture: string } | null;
      };
    };
  }
}

async function tapGameKey(page: Page, key: string): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(80);
  await page.keyboard.up(key);
}

async function continueInGarden(
  page: Page,
  position: { x: number; y: number },
  facing: 'up' | 'down' | 'left' | 'right',
): Promise<void> {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.evaluate(({ position: nextPosition, facing: nextFacing }) => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const seeded = {
      ...state,
      currentScene: 'VioletGarden',
      lastSafe: { scene: 'VioletGarden', position: nextPosition },
      facing: nextFacing,
      preferences: { ...state.preferences, reducedMotion: true },
    };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 2, savedAt: Date.now(), state: seeded }));
  }, { position, facing });
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('VioletGarden');
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
});

test('starts a new dream and moves continuously', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await expect(page.locator('#step-counter')).toContainText('STEPS 0000');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(520);
  await page.keyboard.up('ArrowRight');

  const state = await page.evaluate(() => window.__MOONVEIL__?.state());
  expect(state?.steps.real).toBeGreaterThan(0);
  expect(state?.prologue.loopCount).toBe(0);
});

test('crossing the left seam returns DREAMER from the right with the camera', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');

  const initialView = await page.evaluate(() => window.__MOONVEIL__?.view());
  expect(initialView?.player).toMatchObject({ x: 320, y: 208 });

  await page.keyboard.down('ArrowLeft');
  try {
    await expect.poll(
      () => page.evaluate(() => window.__MOONVEIL__?.state().prologue.loopCount),
      { timeout: 7_000 },
    ).toBe(1);
  } finally {
    await page.keyboard.up('ArrowLeft');
  }

  const wrappedView = await page.evaluate(() => window.__MOONVEIL__?.view());
  expect(wrappedView?.player?.x).toBeGreaterThan(600);
  expect(wrappedView?.camera?.scrollX).toBeGreaterThan(300);
  expect(wrappedView?.player?.y).toBeCloseTo(208, 0);
  expect(await page.evaluate(() => window.__MOONVEIL__?.state().prologue.flowerRevealed)).toBe(true);
});

test('Moth questions stay under the active line and reveal the path', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const seeded = {
      ...state,
      currentScene: 'Prologue',
      lastSafe: { scene: 'Prologue', position: { x: 320, y: 230 } },
      facing: 'up',
      prologue: {
        ...state.prologue,
        loopCount: 3,
        flowerRevealed: true,
        chairTurned: true,
        mothAppeared: true,
      },
      preferences: { ...state.preferences, reducedMotion: true },
    };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 2, savedAt: Date.now(), state: seeded }));
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');

  const dialogue = page.locator('#dialogue');
  const dialogueText = page.locator('#dialogue-text');
  const choices = page.locator('.choice-button');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.view().player)).toMatchObject({ x: 320, y: 230 });
  expect(await page.evaluate(() => window.__MOONVEIL__?.state().prologue.mothAppeared)).toBe(true);
  await tapGameKey(page, 'z');
  await expect(dialogueText).toHaveText('There you are.');
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect(dialogueText).toHaveText('You took so long that I arrived first.');
  await expect(choices).toHaveCount(3);
  await expect(dialogue).not.toContainText('Ask carefully.');

  await page.waitForTimeout(130);
  await page.getByRole('button', { name: 'Where is this?' }).click();
  await expect(dialogueText).toHaveText('Somewhere that misses you.');
  await expect(choices).toHaveCount(2);
  await page.waitForTimeout(130);
  await page.getByRole('button', { name: 'Who are you?' }).click();
  await expect(dialogueText).toHaveText('I was hoping you knew.');
  await expect(choices).toHaveCount(1);
  await page.waitForTimeout(130);
  await page.getByRole('button', { name: 'Who am I?' }).click();
  await expect(dialogueText).toHaveText('Careful. Something might hear you.');
  await expect(choices).toHaveCount(0);

  for (const line of ['Oh.', 'It heard the shape of the question.']) {
    await page.waitForTimeout(130);
    await page.keyboard.press('Enter');
    await expect(dialogueText).toHaveText(line);
  }
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.state().prologue.pathRevealed)).toBe(true);
  await expect(dialogue).toBeHidden();
});

test('garden grass feedback and POCKET inventory behave like the demo', async ({ page }) => {
  await continueInGarden(page, { x: 54, y: 302 }, 'down');

  await tapGameKey(page, 'z');
  await expect(page.locator('#hud-message')).toHaveText('Only the grass answers.');
  await expect(page.locator('#hud-message')).toBeVisible();

  const before = await page.evaluate(() => window.__MOONVEIL__?.view().player);
  await page.keyboard.press('i');
  await expect(page.locator('#inventory')).toBeVisible();
  await expect(page.locator('.inventory-item-name')).toHaveText(['Soft Candy']);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(260);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__MOONVEIL__?.view().player)).toMatchObject(before ?? {});
  await page.keyboard.press('i');
  await expect(page.locator('#inventory')).toBeHidden();
});

test('pond starts with the reflection line', async ({ page }) => {
  await continueInGarden(page, { x: 350, y: 270 }, 'up');
  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('Your reflection blinks first.');
  await expect(page.locator('#dialogue')).not.toContainText('The pond is perfectly still.');
});

test('Sleeping Star is taken without a choice and appears in POCKET', async ({ page }) => {
  await continueInGarden(page, { x: 470, y: 268 }, 'right');
  const dialogueText = page.locator('#dialogue-text');
  await tapGameKey(page, 'z');
  await expect(dialogueText).toHaveText('A tiny star is sleeping in the grass.');
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect(dialogueText).toHaveText('It hums when you hold it close.');
  await expect(page.locator('.choice-button')).toHaveCount(0);
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect.poll(
    () => page.evaluate(() => window.__MOONVEIL__?.state().garden.starTaken),
    { timeout: 3_000 },
  ).toBe(true);

  await expect(dialogueText).toHaveText('SLEEPING STAR');
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect(dialogueText).toHaveText('It dreams of the sky.');
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await page.keyboard.press('i');
  await expect(page.locator('#inventory')).toBeVisible();
  await expect(page.locator('.inventory-item-name')).toHaveText(['Soft Candy', 'Sleeping Star']);
});

test('preferences and progress persist in the single save slot', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.locator('#mute-toggle').click();
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.state().preferences.muted)).toBe(true);
});
