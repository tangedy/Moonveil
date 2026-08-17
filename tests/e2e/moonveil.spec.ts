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
          mothBeforeStarStep: number;
          mothPondResponseHeard: boolean;
          mothAfterStarStep: number;
          pondExamined: boolean;
          starTaken: boolean;
          complete: boolean;
        };
        house: {
          roomsEntered: string[];
          firstObservation: string | null;
          portraitSubject: string | null;
          portraitCommented: boolean;
          breadInterpretation: string | null;
          toyInterpretation: string | null;
          keeperMet: boolean;
          mothHistoryHeard: boolean;
          sproutArrived: boolean;
          sproutSpoken: boolean;
          photographDiscovered: boolean;
          photographBelief: string | null;
          starStatement: string | null;
          starOutcome: string | null;
          unkeptDiscovered: boolean;
          leafPlanted: boolean;
          exitOpened: boolean;
          complete: boolean;
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

async function waitForPrologueCamera(page: Page): Promise<void> {
  await expect.poll(
    () => page.evaluate(() => window.__MOONVEIL__?.view().camera?.scrollY),
    { timeout: 4_500 },
  ).toBeCloseTo(118, 0);
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
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  }, { position, facing });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('VioletGarden');
  await page.waitForTimeout(240);
}

async function continueInHouse(
  page: Page,
  scene: string,
  room: string,
  position: { x: number; y: number },
  housePatch: Record<string, unknown> = {},
  facing: 'up' | 'down' | 'left' | 'right' = 'up',
): Promise<void> {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.evaluate(({ nextScene, nextRoom, nextPosition, nextFacing, nextHousePatch }) => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const rooms = new Set([...state.house.roomsEntered, nextRoom]);
    const seeded = {
      ...state,
      currentScene: nextScene,
      lastSafe: { scene: nextScene, position: nextPosition },
      facing: nextFacing,
      garden: { ...state.garden, complete: true },
      house: {
        ...state.house,
        keeperMet: true,
        roomsEntered: [...rooms],
        ...nextHousePatch,
      },
      preferences: { ...state.preferences, reducedMotion: true, textSpeed: 'fast' },
    };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  }, {
    nextScene: scene,
    nextRoom: room,
    nextPosition: position,
    nextFacing: facing,
    nextHousePatch: housePatch,
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe(scene);
  await page.waitForTimeout(340);
}

async function advanceToChoices(page: Page, count: number): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await page.locator('.choice-button').count() === count) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(35);
  }
  throw new Error(`Dialogue did not present ${count} choices`);
}

async function finishDialogue(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await page.locator('#dialogue').isHidden()) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(35);
  }
  throw new Error('Dialogue did not close');
}

async function reloadAndContinue(page: Page, scene: string): Promise<void> {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe(scene);
  await page.waitForTimeout(340);
}

async function advanceUntilHouseState(
  page: Page,
  key: string,
  expected: string | boolean,
): Promise<void> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const current = await page.evaluate((stateKey) => {
      const house = window.__MOONVEIL__?.state().house as unknown as Record<string, unknown> | undefined;
      return house?.[stateKey];
    }, key);
    if (current === expected) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(50);
  }
  throw new Error(`House state ${key} did not become ${String(expected)}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
});

test('starts a new dream and moves continuously', async ({ page }) => {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await expect(page.locator('#step-counter')).toContainText('STEPS 0000');

  const introStart = await page.evaluate(() => window.__MOONVEIL__?.view());
  expect(introStart?.camera?.scrollY).toBe(-90);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(260);
  await page.keyboard.up('ArrowRight');
  expect(await page.evaluate(() => window.__MOONVEIL__?.view().player)).toMatchObject({ x: 320, y: 208 });

  await page.waitForTimeout(820);
  const descendingY = await page.evaluate(() => window.__MOONVEIL__?.view().camera?.scrollY ?? 0);
  expect(descendingY).toBeGreaterThan(-90);
  expect(descendingY).toBeLessThan(118);
  await waitForPrologueCamera(page);

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
  await waitForPrologueCamera(page);

  const initialView = await page.evaluate(() => window.__MOONVEIL__?.view());
  expect(initialView?.player).toMatchObject({ x: 320, y: 208 });

  await page.keyboard.down('ArrowLeft');
  let continuity: { before: number; after: number } | undefined;
  try {
    continuity = await page.evaluate(() => new Promise<{ before: number; after: number }>((resolve, reject) => {
      const startedAt = performance.now();
      let before: number | undefined;
      const sample = (): void => {
        const view = window.__MOONVEIL__?.view();
        const loopCount = window.__MOONVEIL__?.state().prologue.loopCount;
        if (view?.player && view.camera) {
          const screenX = view.player.x - view.camera.scrollX;
          if (loopCount === 0 && view.player.x < 106) before = screenX;
          if (loopCount === 1 && before !== undefined) {
            resolve({ before, after: screenX });
            return;
          }
        }
        if (performance.now() - startedAt > 7_000) {
          reject(new Error('DREAMER did not cross the seam'));
          return;
        }
        requestAnimationFrame(sample);
      };
      sample();
    }));
  } finally {
    await page.keyboard.up('ArrowLeft');
  }

  const wrappedView = await page.evaluate(() => window.__MOONVEIL__?.view());
  expect(wrappedView?.player?.x).toBeGreaterThan(530);
  expect(wrappedView?.camera?.scrollX).toBeGreaterThan(300);
  expect(wrappedView?.player?.y).toBeCloseTo(208, 0);
  expect(Math.abs((continuity?.after ?? 0) - (continuity?.before ?? 0))).toBeLessThan(3);
  expect(await page.evaluate(() => window.__MOONVEIL__?.state().prologue.flowerRevealed)).toBe(true);
});

test('the revealed path expands only the right wrap corridor', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const seeded = {
      ...state,
      currentScene: 'Prologue',
      lastSafe: { scene: 'Prologue', position: { x: 520, y: 250 } },
      prologue: {
        ...state.prologue,
        loopCount: 3,
        flowerRevealed: true,
        chairTurned: true,
        mothAppeared: true,
        pathRevealed: true,
      },
      preferences: { ...state.preferences, reducedMotion: true },
    };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.waitForTimeout(240);

  await page.keyboard.down('ArrowRight');
  let maxBeforeWrap = 0;
  try {
    maxBeforeWrap = await page.evaluate(() => new Promise<number>((resolve, reject) => {
      const startedAt = performance.now();
      let maximumX = 0;
      const sample = (): void => {
        const x = window.__MOONVEIL__?.view().player?.x ?? 0;
        maximumX = Math.max(maximumX, x);
        if (maximumX > 650 && x < 130) {
          resolve(maximumX);
          return;
        }
        if (performance.now() - startedAt > 5_000) {
          reject(new Error('DREAMER did not cross the expanded path seam'));
          return;
        }
        requestAnimationFrame(sample);
      };
      sample();
    }));
  } finally {
    await page.keyboard.up('ArrowRight');
  }

  expect(maxBeforeWrap).toBeGreaterThan(650);
  const wrapped = await page.evaluate(() => window.__MOONVEIL__?.view());
  expect(wrapped?.player?.x).toBeGreaterThan(-40);
  expect(wrapped?.player?.x).toBeLessThan(20);
});

test('reduced motion skips the Prologue camera pan', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    localStorage.setItem('moonveil.save.v1', JSON.stringify({
      schema: 4,
      savedAt: Date.now(),
      state: { ...state, preferences: { ...state.preferences, reducedMotion: true } },
    }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  expect(await page.evaluate(() => window.__MOONVEIL__?.view().camera?.scrollY)).toBeCloseTo(118, 0);
});

test('Violet Garden holds at the top before descending to DREAMER', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const gardenState = {
      ...state,
      currentScene: 'VioletGarden',
      lastSafe: { scene: 'VioletGarden', position: { x: 54, y: 302 } },
      preferences: { ...state.preferences, reducedMotion: false },
    };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: gardenState }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__MOONVEIL__?.scene() === 'VioletGarden', undefined, { polling: 'raf' });

  expect(await page.evaluate(() => window.__MOONVEIL__?.view().camera?.scrollY)).toBe(0);
  await page.waitForTimeout(260);
  expect(await page.evaluate(() => window.__MOONVEIL__?.view().camera?.scrollY)).toBe(0);
  await page.waitForTimeout(900);
  const descendingY = await page.evaluate(() => window.__MOONVEIL__?.view().camera?.scrollY ?? 0);
  expect(descendingY).toBeGreaterThan(0);
  expect(descendingY).toBeLessThan(180);
  await expect.poll(
    () => page.evaluate(() => window.__MOONVEIL__?.view().camera?.scrollY),
    { timeout: 3_000 },
  ).toBeCloseTo(180, 0);
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
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.waitForTimeout(240);

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
  await expect(choices).toHaveCount(0);
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect(dialogueText).toHaveText("That isn't a place.");
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect(dialogueText).toHaveText("Most places aren't, until someone misses them.");
  await expect(choices).toHaveCount(2);

  await page.waitForTimeout(130);
  await page.getByRole('button', { name: 'Who are you?' }).click();
  await expect(dialogueText).toHaveText('I was hoping you knew.');
  await expect(choices).toHaveCount(0);
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect(dialogueText).toHaveText('It would have saved us both an introduction.');
  await expect(choices).toHaveCount(1);

  await page.waitForTimeout(130);
  await page.getByRole('button', { name: 'Who am I?' }).click();
  await expect(dialogueText).toHaveText('Careful.');
  await expect(choices).toHaveCount(0);
  await page.waitForTimeout(130);
  await page.keyboard.press('Enter');
  await expect(dialogueText).toHaveText('Something might hear you.');
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
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.state().preferences.muted)).toBe(true);
});

test('Garden completion offers a House interlude continuation', async ({ page }) => {
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Prologue');
  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const seeded = {
      ...state,
      currentScene: 'SliceEnd',
      lastSafe: { scene: 'SliceEnd', position: { x: 160, y: 90 } },
      garden: { ...state.garden, complete: true },
      preferences: { ...state.preferences, reducedMotion: true },
    };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('SliceEnd');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('HouseThreshold');
});

test('Keeper conversations begin only on interaction and advance one conversation at a time', async ({ page }) => {
  await continueInHouse(page, 'HouseThreshold', 'threshold', { x: 195, y: 105 }, {}, 'right');
  await expect(page.locator('#dialogue')).toBeHidden();

  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('You’re late.');
  await finishDialogue(page);
  await expect(page.locator('#dialogue')).toBeHidden();

  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('Please wipe your feet.');
});

test('Violet Garden Moth dialogue follows interaction, pond, and star stages', async ({ page }) => {
  await continueInGarden(page, { x: 89, y: 267 }, 'right');
  await page.waitForTimeout(340);
  await expect(page.locator('#dialogue')).toBeHidden();

  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('Welcome back to the Violet Garden.');
  await finishDialogue(page);
  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('Try not to step on the violets.');
  await finishDialogue(page);

  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const seeded = { ...state, garden: { ...state.garden, pondExamined: true } };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  });
  await reloadAndContinue(page, 'VioletGarden');
  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('My reflection moved.');
  await finishDialogue(page);

  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const seeded = { ...state, garden: { ...state.garden, starTaken: true } };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  });
  await reloadAndContinue(page, 'VioletGarden');
  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('Everything feels familiar.');
  await finishDialogue(page);
  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('Have I been here before?');
  await finishDialogue(page);
  await tapGameKey(page, 'z');
  await expect(page.locator('#dialogue-text')).toHaveText('What am I supposed to do here?');
});

test('the first House observation permanently stabilizes the portrait', async ({ page }) => {
  await continueInHouse(page, 'HouseSittingRoom', 'sitting-room', { x: 69, y: 84 }, {}, 'up');
  await tapGameKey(page, 'z');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.state().house.firstObservation)).toBe('window');
  expect(await page.evaluate(() => window.__MOONVEIL__?.state().house.portraitSubject)).toBe('empty-chair');
  await finishDialogue(page);
  expect(await page.evaluate(() => window.__MOONVEIL__?.state().house.firstObservation)).toBe('window');
});

test('the photograph star can leave by its own choice and enter POCKET', async ({ page }) => {
  await continueInHouse(
    page,
    'HouseHallway',
    'hallway',
    { x: 221, y: 113 },
    {
      roomsEntered: ['threshold', 'sitting-room', 'bedroom', 'hallway', 'kitchen', 'nursery'],
      firstObservation: 'portrait',
      portraitSubject: 'woman',
      portraitCommented: true,
      breadInterpretation: 'welcome',
      toyInterpretation: 'company',
      mothHistoryHeard: true,
      sproutArrived: true,
      sproutSpoken: true,
    },
    'up',
  );
  await tapGameKey(page, 'z');
  await advanceToChoices(page, 3);
  await page.getByRole('button', { name: 'The photograph would erase Keeper.' }).click();
  await advanceToChoices(page, 4);
  await page.getByRole('button', { name: 'I don’t know what will happen outside.' }).click();
  await advanceUntilHouseState(page, 'starOutcome', 'left');
  await finishDialogue(page);
  await page.keyboard.press('i');
  await expect(page.locator('.inventory-item-name')).toHaveText(['Soft Candy', 'Photograph Star']);
});

test('the living passage completes the House without reconstructing the past', async ({ page }) => {
  await continueInHouse(
    page,
    'HouseUnkeptRoom',
    'unkept-room',
    { x: 153, y: 151 },
    {
      roomsEntered: ['threshold', 'sitting-room', 'bedroom', 'hallway', 'kitchen', 'nursery', 'unkept-room'],
      firstObservation: 'drawer',
      portraitSubject: 'dreamer',
      portraitCommented: true,
      breadInterpretation: 'habit',
      toyInterpretation: 'waiting',
      mothHistoryHeard: true,
      sproutArrived: true,
      sproutSpoken: true,
      photographDiscovered: true,
      photographBelief: 'neither',
      starStatement: 'choose',
      starOutcome: 'delayed',
      unkeptDiscovered: true,
    },
    'up',
  );
  await tapGameKey(page, 'z');
  await advanceUntilHouseState(page, 'leafPlanted', true);
  await finishDialogue(page);
  await page.evaluate(() => {
    const state = window.__MOONVEIL__?.state();
    if (!state) throw new Error('Moonveil state is unavailable');
    const seeded = {
      ...state,
      currentScene: 'HouseUnkeptRoom',
      lastSafe: { scene: 'HouseUnkeptRoom', position: { x: 278, y: 116 } },
      facing: 'right',
    };
    localStorage.setItem('moonveil.save.v1', JSON.stringify({ schema: 4, savedAt: Date.now(), state: seeded }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('Launch');
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene())).toBe('HouseUnkeptRoom');
  await page.waitForTimeout(340);
  await tapGameKey(page, 'z');
  await finishDialogue(page);
  await expect.poll(() => page.evaluate(() => window.__MOONVEIL__?.scene()), { timeout: 3_000 }).toBe('SliceEnd');
  expect(await page.evaluate(() => window.__MOONVEIL__?.state().house.complete)).toBe(true);
});
