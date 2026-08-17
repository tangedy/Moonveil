import type Phaser from 'phaser';
import { houseDialogue } from '../content/houseWithoutDoors';
import { PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, hud, saveService, stateStore } from '../game/services';
import type { Position } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseThresholdScene extends HouseRoomScene {
  private housePassage!: Phaser.GameObjects.Image;

  constructor() {
    super(SceneId.HouseThreshold, 'threshold', 'The House waits for a more specific question.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseThreshold].left;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.black, 0.82);
    g.fillRect(14, 14, 82, 152);
    g.fillStyle(PALETTE.violetDark, 0.35);
    g.fillRect(104, 27, 198, 133);
    g.lineStyle(3, PALETTE.violetLight, 0.24);
    g.lineBetween(98, 24, 98, 93);
    g.lineBetween(98, 137, 98, 160);
    g.fillStyle(PALETTE.black);
    g.fillRect(94, 94, 12, 42);
    g.fillStyle(PALETTE.violet, 0.18);
    g.fillEllipse(54, 91, 58, 94);
    g.fillStyle(PALETTE.paper, 0.055);
    g.fillRect(116, 38, 172, 82);
    g.lineStyle(1, PALETTE.violetLight, 0.11);
    for (let x = 120; x < 290; x += 20) g.lineBetween(x, 38, x, 120);
    for (let y = 42; y < 120; y += 16) g.lineBetween(116, y, 288, y);

    this.addMoth(55, 111);
    this.addKeeper(218, 105);
    this.housePassage = this.addPassage(292, 116, stateStore.snapshot.house.keeperMet);
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
    const hasAssociations = Boolean(house.breadInterpretation && house.toyInterpretation);
    if (!house.thresholdMothSpoken) {
      await this.say(houseDialogue.thresholdMoth);
      stateStore.markThresholdMothSpoken();
      this.checkpoint();
      return;
    }
    if (hasAssociations && !house.mothHistoryHeard) {
      await this.say(houseDialogue.historyContradiction);
      await this.say(houseDialogue.mothKeeperTension);
      stateStore.markMothHistoryHeard();
      saveService.save(stateStore.snapshot);
      hud.showMessage('The photograph is awake.');
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
