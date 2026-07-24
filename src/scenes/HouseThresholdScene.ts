import type Phaser from 'phaser';
import { houseDialogue } from '../content/houseWithoutDoors';
import { PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, saveService, stateStore } from '../game/services';
import type { Position } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseThresholdScene extends HouseRoomScene {
  private housePassage!: Phaser.GameObjects.Image;

  constructor() {
    super(SceneId.HouseThreshold, 'threshold', 'THE THRESHOLD', 'The House waits for a more specific question.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseThreshold].left;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.black, 0.7);
    g.fillRect(14, 14, 82, 152);
    g.fillStyle(PALETTE.violetDark, 0.72);
    g.fillRect(96, 20, 210, 146);
    g.lineStyle(2, PALETTE.paper, 0.45);
    g.lineBetween(96, 20, 96, 166);
    g.fillStyle(PALETTE.violet, 0.28);
    g.fillEllipse(56, 74, 58, 76);
    g.fillStyle(PALETTE.paper, 0.1);
    g.fillRect(108, 33, 184, 97);
    g.lineStyle(1, PALETTE.violetLight, 0.18);
    for (let y = 35; y < 130; y += 16) g.lineBetween(108, y, 292, y);

    this.addMoth(55, 111);
    this.addKeeper(218, 105);
    this.housePassage = this.addPassage(292, 116, stateStore.snapshot.house.keeperMet);
    this.addObjectCaption(55, 139, 'OUTSIDE');
    this.addObjectCaption(271, 145, 'A ROOM EXPECTING YOU');
    this.addCollider(150, 72, 54, 25);
  }

  protected registerRoomInteractions(): void {
    this.addInteraction({
      id: 'threshold-moth',
      kind: 'npc',
      x: 55,
      y: 111,
      radius: 10,
      interact: () => this.talkToMoth(),
    });
    this.addInteraction({
      id: 'threshold-keeper',
      kind: 'npc',
      x: 218,
      y: 105,
      radius: 10,
      interact: () => this.talkToKeeper(),
    });
    this.addInteraction({
      id: 'threshold-house',
      kind: 'object',
      x: 292,
      y: 116,
      radius: 13,
      enabled: () => stateStore.snapshot.house.keeperMet,
      interact: () => this.transitionTo(SceneId.HouseSittingRoom, HOUSE_SPAWNS[SceneId.HouseSittingRoom].left),
    });
  }

  private async talkToMoth(): Promise<void> {
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
}
