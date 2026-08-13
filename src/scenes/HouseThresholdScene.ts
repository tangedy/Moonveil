import Phaser from 'phaser';
import { houseDialogue } from '../content/houseWithoutDoors';
import { gardenDialogue } from '../content/violetGarden';
import { PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, saveService, stateStore } from '../game/services';
import type { Position } from '../state/GameState';
import type { InteractionTarget } from '../systems/InteractionSystem';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

const WORLD_WIDTH = 960;
const HOUSE_OFFSET_X = 640;
const HOUSE_DIVIDER_X = HOUSE_OFFSET_X + 96;
const HOUSE_ARRIVAL_X = HOUSE_OFFSET_X + 70;
const MOTH_START = { x: 18, y: 116 } as const;
const MOTH_STOP = { x: HOUSE_OFFSET_X + 55, y: 111 } as const;
const KEEPER_POSITION = { x: HOUSE_OFFSET_X + 218, y: 105 } as const;
const PASSAGE_POSITION = { x: HOUSE_OFFSET_X + 292, y: 116 } as const;

export class HouseThresholdScene extends HouseRoomScene {
  private housePassage!: Phaser.GameObjects.Image;
  private moth!: Phaser.GameObjects.Image;
  private mothTarget!: InteractionTarget;
  private readonly mothPosition = new Phaser.Math.Vector2(MOTH_START.x, MOTH_START.y);
  private mothAtHouse = false;

  constructor() {
    super(SceneId.HouseThreshold, 'threshold', 'THE THRESHOLD', 'The House waits for a more specific question.');
  }

  protected get worldWidth(): number {
    return WORLD_WIDTH;
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseThreshold].left;
  }

  protected configureCamera(): void {
    this.cameras.main.startFollow(this.dreamer, true, 0.14, 0.14);
    this.cameras.main.setRoundPixels(true);

    this.mothAtHouse = this.dreamer.x >= HOUSE_ARRIVAL_X;
    if (this.mothAtHouse) {
      this.mothPosition.set(MOTH_STOP.x, MOTH_STOP.y);
    } else {
      this.mothPosition.set(Math.max(MOTH_START.x, this.dreamer.x - 24), this.dreamer.y + 5);
    }
    this.positionMoth(0);
  }

  protected drawRoomShell(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink);
    g.fillRect(0, 0, WORLD_WIDTH, 180);

    g.fillStyle(PALETTE.violetDeep);
    g.fillRoundedRect(9, 9, HOUSE_DIVIDER_X - 9, 162, 14);
    g.fillStyle(PALETTE.violetDark);
    g.fillRoundedRect(14, 14, HOUSE_DIVIDER_X - 19, 152, 18);
    g.fillStyle(PALETTE.violet, 0.3);
    g.fillRoundedRect(18, 28, HOUSE_DIVIDER_X - 27, 124, 22);

    g.fillStyle(PALETTE.paper, 0.12);
    g.fillRoundedRect(14, 96, 184, 40, 17);
    g.fillRoundedRect(176, 88, 178, 42, 17);
    g.fillRoundedRect(332, 101, 185, 42, 17);
    g.fillRoundedRect(495, 92, 177, 43, 17);
    g.fillRoundedRect(642, 96, 78, 41, 15);

    g.lineStyle(1, PALETTE.violetLight, 0.18);
    for (let x = 28; x < HOUSE_OFFSET_X; x += 19) {
      for (let y = 30; y < 157; y += 17) {
        if ((x + y) % 4 === 0) g.strokeCircle(x, y, 2);
        else g.lineBetween(x, y, x + 2, y - 3);
      }
    }

    g.fillStyle(PALETTE.violetDeep, 0.82);
    for (let x = 44; x < HOUSE_OFFSET_X; x += 13) {
      const top = 31 + (x % 11);
      const bottom = 157 - (x % 9);
      g.fillTriangle(x, top + 8, x + 4, top, x + 8, top + 8);
      g.fillTriangle(x, bottom, x + 4, bottom - 8, x + 8, bottom);
    }

    g.fillStyle(PALETTE.ink, 0.76);
    for (let x = 8; x < HOUSE_DIVIDER_X; x += 18) {
      g.fillCircle(x, 12 + (x % 4), 11);
      g.fillCircle(x, 169 - (x % 3), 11);
    }

    g.fillStyle(PALETTE.ink);
    g.fillRect(HOUSE_OFFSET_X, 0, 320, 180);
    g.fillStyle(PALETTE.violetDeep);
    g.fillRect(HOUSE_OFFSET_X + 9, 9, 302, 162);
    g.fillStyle(PALETTE.violetDark, 0.24);
    g.fillRect(HOUSE_OFFSET_X + 14, 14, 292, 125);
    g.fillStyle(PALETTE.black, 0.55);
    g.fillRect(HOUSE_OFFSET_X + 14, 139, 292, 27);
    g.lineStyle(1, PALETTE.violet, 0.16);
    for (let x = HOUSE_OFFSET_X + 17; x < HOUSE_OFFSET_X + 305; x += 17) {
      g.lineBetween(x, 140, x + 8, 166);
    }
    g.lineStyle(1, PALETTE.paper, 0.08);
    g.strokeRect(HOUSE_OFFSET_X + 12, 12, 296, 156);

    this.add.text(HOUSE_OFFSET_X + 18, 17, this.roomTitle, {
      fontFamily: 'monospace',
      fontSize: '5px',
      color: '#c9a7f2',
      letterSpacing: 1,
    }).setAlpha(0.5).setDepth(3);
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.black, 0.7);
    g.fillRect(HOUSE_OFFSET_X + 14, 14, 82, 152);
    g.fillStyle(PALETTE.violetDark, 0.72);
    g.fillRect(HOUSE_DIVIDER_X, 20, 210, 146);
    g.lineStyle(2, PALETTE.paper, 0.45);
    g.lineBetween(HOUSE_DIVIDER_X, 20, HOUSE_DIVIDER_X, 166);
    g.fillStyle(PALETTE.violet, 0.28);
    g.fillEllipse(MOTH_STOP.x + 1, 74, 58, 76);
    g.fillStyle(PALETTE.paper, 0.1);
    g.fillRect(HOUSE_OFFSET_X + 108, 33, 184, 97);
    g.lineStyle(1, PALETTE.violetLight, 0.18);
    for (let y = 35; y < 130; y += 16) {
      g.lineBetween(HOUSE_OFFSET_X + 108, y, HOUSE_OFFSET_X + 292, y);
    }

    const flowerPositions = [
      [82, 57], [150, 151], [224, 51], [306, 151], [388, 58], [473, 151], [548, 51], [610, 148],
    ] as const;
    flowerPositions.forEach(([x, y], index) => {
      const texture = index === 6 && stateStore.snapshot.garden.whiteFlower
        ? TextureKey.FlowerWhite
        : TextureKey.Flower;
      this.add.image(x, y, assetRegistry.resolve(this, texture))
        .setDepth(7)
        .setScale(index % 2 === 0 ? 0.88 : 0.72)
        .setAlpha(0.86);
    });

    this.mothPosition.set(MOTH_START.x, MOTH_START.y);
    this.moth = this.add.image(MOTH_START.x, MOTH_START.y, assetRegistry.resolve(this, TextureKey.Moth0)).setDepth(24);
    this.addKeeper(KEEPER_POSITION.x, KEEPER_POSITION.y);
    this.housePassage = this.addPassage(
      PASSAGE_POSITION.x,
      PASSAGE_POSITION.y,
      stateStore.snapshot.house.keeperMet,
    );
    this.addObjectCaption(MOTH_STOP.x, 139, 'OUTSIDE');
    this.addObjectCaption(HOUSE_OFFSET_X + 271, 145, 'A ROOM EXPECTING YOU');

    this.addCollider(116, 48, 68, 29);
    this.addCollider(273, 154, 92, 20);
    this.addCollider(412, 47, 68, 27);
    this.addCollider(548, 155, 82, 20);
    this.addCollider(624, 49, 42, 25);
    this.addCollider(HOUSE_OFFSET_X + 150, 72, 54, 25);
  }

  protected registerRoomInteractions(): void {
    this.mothTarget = {
      id: 'threshold-moth',
      kind: 'npc',
      x: this.moth.x,
      y: this.moth.y,
      radius: 10,
      interact: () => this.talkToMoth(),
    };
    this.addInteraction(this.mothTarget);
    this.addInteraction({
      id: 'threshold-keeper',
      kind: 'npc',
      x: KEEPER_POSITION.x,
      y: KEEPER_POSITION.y,
      radius: 10,
      interact: () => this.talkToKeeper(),
    });
    this.addInteraction({
      id: 'threshold-house',
      kind: 'object',
      x: PASSAGE_POSITION.x,
      y: PASSAGE_POSITION.y,
      radius: 13,
      enabled: () => stateStore.snapshot.house.keeperMet,
      interact: () => this.transitionTo(SceneId.HouseSittingRoom, HOUSE_SPAWNS[SceneId.HouseSittingRoom].left),
    });
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    if (!this.dreamer || this.transitioning || !this.moth) return;

    if (!this.mothAtHouse && this.dreamer.x >= HOUSE_ARRIVAL_X) this.mothAtHouse = true;

    const targetX = this.mothAtHouse ? MOTH_STOP.x : Math.max(MOTH_START.x, this.dreamer.x - 24);
    const targetY = this.mothAtHouse ? MOTH_STOP.y : this.dreamer.y + 5;
    const response = Phaser.Math.Clamp(delta / 105, 0, 1);
    this.mothPosition.x = Phaser.Math.Linear(this.mothPosition.x, targetX, response);
    this.mothPosition.y = Phaser.Math.Linear(this.mothPosition.y, targetY, response);
    this.positionMoth(time);
  }

  private async talkToMoth(): Promise<void> {
    if (!this.mothAtHouse) {
      const step = Math.min(
        stateStore.snapshot.garden.mothAfterStarStep,
        gardenDialogue.mothAfterStar.length - 1,
      );
      await this.say(gardenDialogue.mothAfterStar[step]!);
      stateStore.advanceGardenMothAfterStar();
      this.checkpoint();
      return;
    }

    const house = stateStore.snapshot.house;
    const hasAssociation = Boolean(house.breadInterpretation || house.toyInterpretation);
    if (!house.thresholdMothSpoken) {
      await this.say(houseDialogue.thresholdMoth);
      stateStore.markThresholdMothSpoken();
      this.checkpoint();
      return;
    }
    if (hasAssociation && !house.mothHistoryHeard) {
      await this.say(houseDialogue.historyContradiction);
      await this.say(houseDialogue.mothKeeperTension);
      stateStore.markMothHistoryHeard();
      saveService.save(stateStore.snapshot);
      return;
    }
    await this.say(houseDialogue.thresholdMothRepeat);
  }

  private async talkToKeeper(): Promise<void> {
    const step = stateStore.snapshot.house.keeperIntroductionStep;
    const introduction = houseDialogue.keeperIntroduction[step];
    if (!introduction) {
      await this.say(houseDialogue.keeperThresholdRepeat);
      return;
    }

    await this.say(introduction);
    stateStore.advanceKeeperIntroduction(houseDialogue.keeperIntroduction.length);
    this.housePassage.setTexture(assetRegistry.resolve(this, TextureKey.PassageStable));
    this.checkpoint();
  }

  private positionMoth(time: number): void {
    const bob = stateStore.snapshot.preferences.reducedMotion ? 0 : Math.sin(time / 170) * 1.4;
    this.moth.setPosition(this.mothPosition.x, this.mothPosition.y + bob);
    if (this.mothTarget) {
      this.mothTarget.x = this.moth.x;
      this.mothTarget.y = this.moth.y;
    }
  }
}
