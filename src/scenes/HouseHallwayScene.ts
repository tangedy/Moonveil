import type Phaser from 'phaser';
import { houseChoices, houseDialogue } from '../content/houseWithoutDoors';
import { AudioCue, PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, hud, stateStore } from '../game/services';
import type { PhotographBelief, PortraitSubject, Position, StarStatement } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseHallwayScene extends HouseRoomScene {
  private portrait!: Phaser.GameObjects.Image;
  private photograph!: Phaser.GameObjects.Image;
  private unkeptPassage!: Phaser.GameObjects.Image;

  constructor() {
    super(SceneId.HouseHallway, 'hallway', 'THE HALLWAY OF PORTRAITS', 'The walls request privacy.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseHallway].bottom;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.black, 0.58);
    g.fillRect(31, 25, 258, 74);
    g.lineStyle(2, PALETTE.violetDark, 0.9);
    for (let x = 45; x < 286; x += 48) {
      g.strokeRect(x, 35 + (x % 3), 29, 42);
      g.lineBetween(x + 4, 39, x + 25, 73);
      g.lineBetween(x + 25, 39, x + 4, 73);
    }
    g.fillStyle(PALETTE.violet, 0.18);
    g.fillRect(25, 104, 270, 35);
    g.lineStyle(1, PALETTE.paper, 0.12);
    for (let x = 30; x < 292; x += 14) g.lineBetween(x, 106, x + 20, 138);

    const subject = stateStore.snapshot.house.portraitSubject ?? 'woman';
    this.portrait = this.add.image(125, 61, this.portraitTexture(subject))
      .setAlpha(stateStore.snapshot.house.portraitCommented ? 1 : 0.22)
      .setDepth(9);
    this.photograph = this.add.image(221, 83, this.photographTexture()).setDepth(10)
      .setVisible(stateStore.snapshot.house.portraitCommented);
    this.addKeeper(258, 132);
    if (stateStore.snapshot.house.sproutArrived) this.addSprout(63, 132);

    this.addPassage(20, 118, false, Math.PI);
    this.addPassage(160, 159, false, Math.PI / 2);
    this.unkeptPassage = this.addPassage(160, 21, true, -Math.PI / 2, stateStore.snapshot.house.unkeptDiscovered ? 1 : 0);
    this.addObjectCaption(125, 88, 'THE PORTRAIT THAT AGREES');
    this.addObjectCaption(221, 104, 'A FAMILY PHOTOGRAPH');
  }

  protected registerRoomInteractions(): void {
    this.addInteraction({ id: 'hallway-bedroom', kind: 'object', x: 20, y: 118, radius: 12, interact: () => this.transitionTo(SceneId.HouseBedroom, HOUSE_SPAWNS[SceneId.HouseBedroom].top) });
    this.addInteraction({ id: 'hallway-sitting', kind: 'object', x: 160, y: 159, radius: 13, interact: () => this.transitionTo(SceneId.HouseSittingRoom, HOUSE_SPAWNS[SceneId.HouseSittingRoom].top) });
    this.addInteraction({
      id: 'hallway-unkept',
      kind: 'object',
      x: 160,
      y: 21,
      radius: 13,
      enabled: () => stateStore.snapshot.house.unkeptDiscovered,
      interact: () => this.transitionTo(SceneId.HouseUnkeptRoom, HOUSE_SPAWNS[SceneId.HouseUnkeptRoom].bottom),
    });
    this.addInteraction({ id: 'hallway-length', kind: 'object', x: 83, y: 111, radius: 24, interact: () => this.say(houseDialogue.hallwayLength) });
    this.addInteraction({ id: 'hallway-portrait', kind: 'object', x: 125, y: 61, radius: 24, interact: () => this.inspectPortrait() });
    this.addInteraction({
      id: 'hallway-photograph',
      kind: 'object',
      x: 221,
      y: 83,
      radius: 17,
      enabled: () => stateStore.snapshot.house.portraitCommented,
      interact: () => this.inspectPhotograph(),
    });
    this.addInteraction({
      id: 'hallway-keeper',
      kind: 'npc',
      x: 258,
      y: 132,
      radius: 10,
      interact: () => this.talkToRoomKeeper(houseDialogue.hallwayArrival, houseDialogue.keeperMemory),
    });
    if (stateStore.snapshot.house.sproutArrived) {
      this.addInteraction({
        id: 'hallway-sprout',
        kind: 'npc',
        x: 63,
        y: 132,
        radius: 10,
        interact: () => this.talkToHouseSprout(
          stateStore.snapshot.house.starOutcome ? houseDialogue.sproutAfterPhoto : houseDialogue.sproutRepeat,
        ),
      });
    }
  }

  private async inspectPortrait(): Promise<void> {
    const house = stateStore.snapshot.house;
    if (house.portraitCommented) {
      await this.say(houseDialogue.portraitRepeat);
      return;
    }

    let subject = house.portraitSubject;
    await this.conversation(async (present) => {
      await present(houseDialogue.portraitFirst);
      subject ??= stateStore.observeHouseFirst('portrait');
      this.portrait.setTexture(this.portraitTexture(subject)).setAlpha(1);
      await present(houseDialogue.portraitSubject[subject]);
      await present(houseDialogue.portraitSettles);
      stateStore.markPortraitCommented();
      this.photograph.setVisible(true);
      this.checkpoint();
    });
  }

  private async inspectPhotograph(): Promise<void> {
    if (stateStore.snapshot.house.starOutcome) {
      await this.say(houseDialogue.photographAfter);
      return;
    }
    if (!stateStore.snapshot.house.mothHistoryHeard) {
      await this.say(houseDialogue.photographNeedsMoth);
      return;
    }

    await this.conversation(async (present) => {
      if (!stateStore.snapshot.house.photographDiscovered) {
        await present(houseDialogue.photographDiscover);
        stateStore.discoverHousePhotograph();
      }

      let belief = stateStore.snapshot.house.photographBelief;
      if (!belief) {
        const selectedBelief = await present(houseDialogue.beliefPrompt, houseChoices.belief);
        if (!selectedBelief) return;
        belief = selectedBelief as PhotographBelief;
        stateStore.setPhotographBelief(belief);
        await present(houseDialogue.beliefResponse[belief]);
      }

      const selectedStatement = await present(houseDialogue.starResistance, houseChoices.star);
      if (!selectedStatement) return;
      const statement = selectedStatement as StarStatement;
      await present(houseDialogue.starResponse[statement]);

      const wasHidden = !stateStore.snapshot.house.unkeptDiscovered;
      const outcome = stateStore.resolveHouseStar(statement);
      this.photograph.setTexture(this.photographTexture());
      this.checkpoint();
      audioManager.cue(AudioCue.Photograph);
      if (!stateStore.snapshot.preferences.reducedMotion) {
        this.tweens.add({ targets: this.photograph, alpha: 0.25, duration: 160, yoyo: true, repeat: 2 });
        await this.wait(540);
      }
      await present(houseDialogue.starOutcome[outcome]);

      if (wasHidden && stateStore.snapshot.house.unkeptDiscovered) {
        this.unkeptPassage.setAlpha(1);
        audioManager.cue(AudioCue.PassageMemory);
        hud.showMessage('Roots press against the north wall.');
        await present(houseDialogue.sproutAfterPhoto);
      }
    });
  }

  private portraitTexture(subject: PortraitSubject): string {
    const key = subject === 'woman'
      ? TextureKey.PortraitWoman
      : subject === 'empty-chair'
        ? TextureKey.PortraitChair
        : TextureKey.PortraitDreamer;
    return assetRegistry.resolve(this, key);
  }

  private photographTexture(): string {
    const outcome = stateStore.snapshot.house.starOutcome;
    const key = outcome === 'left'
      ? TextureKey.PhotographEmpty
      : outcome === 'shared'
        ? TextureKey.PhotographShared
        : outcome === 'remained' || outcome === 'delayed'
          ? TextureKey.PhotographStill
          : TextureKey.PhotographStar;
    return assetRegistry.resolve(this, key);
  }
}
