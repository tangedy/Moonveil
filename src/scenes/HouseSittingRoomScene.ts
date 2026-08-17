import { houseChoices, houseDialogue } from '../content/houseWithoutDoors';
import { AudioCue, PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, hud, stateStore } from '../game/services';
import type { Position, ToyInterpretation } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseSittingRoomScene extends HouseRoomScene {
  private toyPassage!: Phaser.GameObjects.Image;
  private sproutPresent = false;

  constructor() {
    super(SceneId.HouseSittingRoom, 'sitting-room', 'THE SITTING ROOM', 'The rain declines to answer for the furniture.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseSittingRoom].left;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.paper, 0.07);
    g.fillRect(42, 29, 54, 46);
    g.lineStyle(1, PALETTE.violetLight, 0.42);
    g.strokeRect(42, 29, 54, 46);
    g.lineBetween(69, 29, 69, 75);
    g.lineBetween(42, 52, 96, 52);
    g.fillStyle(PALETTE.violet, 0.24);
    for (let x = 48; x < 95; x += 8) g.lineBetween(x, 31, x - 4, 71);

    g.fillStyle(PALETTE.black, 0.5);
    g.fillRoundedRect(137, 91, 66, 36, 4);
    g.fillStyle(PALETTE.violetDark);
    g.fillRoundedRect(142, 94, 50, 28, 3);
    g.fillStyle(PALETTE.paper, 0.32);
    g.fillRoundedRect(147, 99, 40, 18, 2);
    g.lineStyle(1, PALETTE.violetLight, 0.32);
    g.strokeRoundedRect(142, 94, 50, 28, 3);
    const chairs = [[148, 84], [167, 84], [186, 84], [148, 132], [167, 132], [186, 132]] as const;
    chairs.forEach(([x, y]) => {
      g.fillStyle(PALETTE.black, 0.45);
      g.fillRect(x - 5, y - 4, 12, 10);
      g.fillStyle(PALETTE.violet, 0.52);
      g.fillRect(x - 5, y - 5, 10, 8);
      g.fillStyle(PALETTE.violetLight, 0.2);
      g.fillRect(x - 4, y - 4, 8, 2);
    });

    this.add.image(224, 132, assetRegistry.resolve(this, TextureKey.WoodenToy)).setDepth(10);
    this.addKeeper(257, 101);
    if (stateStore.snapshot.house.sproutArrived) this.installSprout();

    this.addPassage(20, 116, true, Math.PI);
    this.addPassage(300, 116, false);
    this.addPassage(160, 21, false, -Math.PI / 2);
    this.toyPassage = this.addPassage(160, 159, Boolean(stateStore.snapshot.house.toyInterpretation), Math.PI / 2);

    this.addObjectCaption(69, 82, 'A WINDOW WITH NO OUTSIDE');
    this.addObjectCaption(166, 137, 'SIX CHAIRS · ONE PLACE');
    this.addCollider(167, 109, 76, 47);
  }

  protected registerRoomInteractions(): void {
    this.addInteraction({ id: 'sitting-threshold', kind: 'object', x: 20, y: 116, radius: 12, interact: () => this.transitionTo(SceneId.HouseThreshold, HOUSE_SPAWNS[SceneId.HouseThreshold].right) });
    this.addInteraction({ id: 'sitting-bedroom', kind: 'object', x: 300, y: 116, radius: 12, interact: () => this.transitionTo(SceneId.HouseBedroom, HOUSE_SPAWNS[SceneId.HouseBedroom].left) });
    this.addInteraction({ id: 'sitting-hallway', kind: 'object', x: 160, y: 21, radius: 13, interact: () => this.transitionTo(SceneId.HouseHallway, HOUSE_SPAWNS[SceneId.HouseHallway].bottom) });
    this.addInteraction({ id: 'sitting-nursery', kind: 'object', x: 160, y: 159, radius: 13, interact: () => this.transitionTo(SceneId.HouseNursery, HOUSE_SPAWNS[SceneId.HouseNursery].top) });
    this.addInteraction({ id: 'sitting-window', kind: 'object', x: 69, y: 53, radius: 25, interact: () => this.inspectWindow() });
    this.addInteraction({ id: 'sitting-rain', kind: 'object', x: 135, y: 87, radius: 18, interact: () => this.say(houseDialogue.rainFurniture) });
    this.addInteraction({ id: 'sitting-chairs', kind: 'object', x: 168, y: 108, radius: 35, interact: () => this.say(houseDialogue.chairs) });
    this.addInteraction({ id: 'sitting-toy', kind: 'object', x: 224, y: 132, radius: 9, interact: () => this.inspectToy() });
    this.addInteraction({
      id: 'sitting-keeper',
      kind: 'npc',
      x: 257,
      y: 101,
      radius: 10,
      interact: () => this.talkToRoomKeeper(houseDialogue.sittingArrival, houseDialogue.keeperPreservation),
    });
    if (this.sproutPresent) this.registerSproutInteraction();
  }

  private async inspectWindow(): Promise<void> {
    const first = stateStore.snapshot.house.firstObservation === null;
    if (first) {
      stateStore.observeHouseFirst('window');
      this.checkpoint();
    }
    await this.say(first ? houseDialogue.windowFirst : houseDialogue.windowRepeat);
  }

  private async inspectToy(): Promise<void> {
    const house = stateStore.snapshot.house;
    if (house.toyInterpretation) {
      await this.say(houseDialogue.toyAfter);
      return;
    }
    if (!house.roomsEntered.includes('nursery')) {
      await this.say(houseDialogue.toyBefore);
      return;
    }

    const selected = await this.choose(houseDialogue.toyPrompt, houseChoices.toy);
    if (!selected) return;
    const interpretation = selected as ToyInterpretation;
    const resolved = stateStore.resolveToyAssociation(interpretation);
    if (!resolved) return;
    this.toyPassage.setTexture(assetRegistry.resolve(this, TextureKey.PassageStable));
    audioManager.cue(AudioCue.PassageMemory);
    this.checkpoint();
    await this.say(houseDialogue.toyResolved[interpretation]);
    if (stateStore.snapshot.house.sproutArrived && !this.sproutPresent) {
      this.installSprout();
      this.registerSproutInteraction();
      hud.showMessage('Something entered through the window.');
    }
  }

  private installSprout(): void {
    if (this.sproutPresent) return;
    this.sproutPresent = true;
    this.addSprout(103, 132);
  }

  private registerSproutInteraction(): void {
    this.addInteraction({
      id: 'sitting-sprout',
      kind: 'npc',
      x: 103,
      y: 132,
      radius: 10,
      interact: () => this.talkToHouseSprout(
        stateStore.snapshot.house.starOutcome ? houseDialogue.sproutAfterPhoto : houseDialogue.sproutRepeat,
      ),
    });
  }
}
