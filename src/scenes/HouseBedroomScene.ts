import type Phaser from 'phaser';
import { houseChoices, houseDialogue } from '../content/houseWithoutDoors';
import { AudioCue, PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, hud, stateStore } from '../game/services';
import type { BreadInterpretation, Position } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseBedroomScene extends HouseRoomScene {
  private kitchenPassage!: Phaser.GameObjects.Image;
  private sproutPresent = false;

  constructor() {
    super(SceneId.HouseBedroom, 'bedroom', 'The sheets pretend to be asleep.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseBedroom].left;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.violetDark);
    g.fillRoundedRect(80, 70, 112, 62, 5);
    g.fillStyle(PALETTE.paper, 0.62);
    g.fillRoundedRect(88, 77, 96, 46, 3);
    g.fillStyle(PALETTE.violetLight, 0.28);
    g.fillRect(92, 81, 40, 17);
    g.lineStyle(1, PALETTE.violetDark, 0.5);
    g.lineBetween(88, 106, 184, 90);
    g.lineBetween(88, 114, 184, 98);

    g.fillStyle(PALETTE.black);
    g.fillRect(220, 76, 55, 48);
    g.fillStyle(PALETTE.violetDark);
    g.fillRect(224, 80, 47, 38);
    g.lineStyle(1, PALETTE.paper, 0.34);
    g.strokeRect(224, 80, 47, 18);
    g.strokeRect(224, 100, 47, 18);
    g.fillStyle(PALETTE.paper, 0.52);
    g.fillCircle(247, 89, 1);
    g.fillCircle(247, 109, 1);

    g.fillStyle(PALETTE.paper, 0.06);
    for (let radius = 5; radius < 25; radius += 6) g.strokeCircle(291, 78, radius);

    this.addKeeper(208, 139);
    if (stateStore.snapshot.house.sproutArrived) this.installSprout();
    this.addPassage(20, 116, true, Math.PI);
    this.kitchenPassage = this.addPassage(300, 116, Boolean(stateStore.snapshot.house.breadInterpretation));
    this.addPassage(160, 21, false, -Math.PI / 2);
    this.addCollider(136, 102, 120, 68);
    this.addCollider(248, 100, 59, 54);
  }

  protected registerRoomInteractions(): void {
    this.addInteraction({ id: 'bedroom-sitting', kind: 'object', x: 20, y: 116, radius: 12, interact: () => this.transitionTo(SceneId.HouseSittingRoom, HOUSE_SPAWNS[SceneId.HouseSittingRoom].right) });
    this.addInteraction({ id: 'bedroom-hallway', kind: 'object', x: 160, y: 21, radius: 13, interact: () => this.transitionTo(SceneId.HouseHallway, HOUSE_SPAWNS[SceneId.HouseHallway].left) });
    this.addInteraction({
      id: 'bedroom-kitchen',
      kind: 'object',
      x: 300,
      y: 116,
      radius: 12,
      enabled: () => Boolean(stateStore.snapshot.house.breadInterpretation),
      interact: () => this.transitionTo(SceneId.HouseKitchen, HOUSE_SPAWNS[SceneId.HouseKitchen].left),
    });
    this.addInteraction({ id: 'bedroom-bed', kind: 'object', x: 136, y: 102, radius: 50, interact: () => this.say(houseDialogue.bed) });
    this.addInteraction({ id: 'bedroom-drawer', kind: 'object', x: 248, y: 100, radius: 27, interact: () => this.inspectDrawer() });
    this.addInteraction({ id: 'bedroom-bread', kind: 'object', x: 291, y: 78, radius: 23, interact: () => this.inspectBread() });
    this.addInteraction({
      id: 'bedroom-keeper',
      kind: 'npc',
      x: 208,
      y: 139,
      radius: 10,
      interact: () => this.talkToRoomKeeper(houseDialogue.bedroomArrival, houseDialogue.keeperMemory),
    });
    if (this.sproutPresent) this.registerSproutInteraction();
  }

  private async inspectDrawer(): Promise<void> {
    const first = stateStore.snapshot.house.firstObservation === null;
    if (first) {
      stateStore.observeHouseFirst('drawer');
      this.checkpoint();
    }
    await this.say(first ? houseDialogue.drawerFirst : houseDialogue.drawerRepeat);
  }

  private async inspectBread(): Promise<void> {
    if (stateStore.snapshot.house.breadInterpretation) {
      await this.say(houseDialogue.breadAfter);
      return;
    }
    await this.say(houseDialogue.breadBefore);
    const selected = await this.choose(houseDialogue.breadPrompt, houseChoices.bread);
    if (!selected) return;
    const interpretation = selected as BreadInterpretation;
    const resolved = stateStore.resolveBreadAssociation(interpretation);
    if (!resolved) return;
    this.kitchenPassage.setTexture(assetRegistry.resolve(this, TextureKey.PassageStable));
    audioManager.cue(AudioCue.PassageMemory);
    this.checkpoint();
    await this.say(houseDialogue.breadResolved[interpretation]);
    if (stateStore.snapshot.house.sproutArrived && !this.sproutPresent) {
      this.installSprout();
      this.registerSproutInteraction();
      hud.showMessage('Something entered through the window.');
    }
  }

  private installSprout(): void {
    if (this.sproutPresent) return;
    this.sproutPresent = true;
    this.addSprout(55, 139);
  }

  private registerSproutInteraction(): void {
    this.addInteraction({
      id: 'bedroom-sprout',
      kind: 'npc',
      x: 55,
      y: 139,
      radius: 10,
      interact: () => this.talkToHouseSprout(
        stateStore.snapshot.house.starOutcome ? houseDialogue.sproutAfterPhoto : houseDialogue.sproutRepeat,
      ),
    });
  }
}
