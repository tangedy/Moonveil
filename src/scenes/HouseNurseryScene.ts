import { houseDialogue } from '../content/houseWithoutDoors';
import { PALETTE, SceneId } from '../game/config';
import { stateStore } from '../game/services';
import type { Position } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseNurseryScene extends HouseRoomScene {
  private sproutPresent = false;

  constructor() {
    super(SceneId.HouseNursery, 'nursery', 'THE NURSERY', 'The cradle rocks at an adult pace.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseNursery].top;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.black);
    g.fillRoundedRect(64, 62, 150, 72, 34);
    g.fillStyle(PALETTE.violetDark);
    g.fillRoundedRect(70, 66, 138, 60, 29);
    g.fillStyle(PALETTE.paper, 0.56);
    g.fillRoundedRect(79, 76, 120, 38, 18);
    g.lineStyle(1, PALETTE.violetLight, 0.42);
    for (let x = 84; x < 200; x += 15) g.lineBetween(x, 72, x, 119);
    g.lineStyle(2, PALETTE.paper, 0.26);
    g.beginPath();
    g.arc(138, 132, 72, 0.15, Math.PI - 0.15, false);
    g.strokePath();

    g.lineStyle(1, PALETTE.violetLight, 0.52);
    for (let index = 0; index < 7; index += 1) {
      const y = 51 + index * 8;
      const width = 25 - index * 2;
      g.lineBetween(247, y, 247 + width, y);
    }
    g.fillStyle(PALETTE.violet, 0.25);
    g.fillCircle(246, 126, 8);
    g.lineStyle(1, PALETTE.paper, 0.32);
    g.strokeCircle(246, 126, 8);
    g.strokeCircle(246, 126, 3);

    this.addKeeper(272, 142);
    if (stateStore.snapshot.house.sproutArrived) this.installSprout();
    this.addPassage(160, 21, Boolean(stateStore.snapshot.house.toyInterpretation), -Math.PI / 2);
    this.addObjectCaption(139, 145, 'BUILT TO BE OUTGROWN');
    this.addObjectCaption(258, 111, 'ONE WHEEL IS MISSING');
    this.addCollider(139, 101, 158, 78);
  }

  protected registerRoomInteractions(): void {
    this.addInteraction({ id: 'nursery-sitting', kind: 'object', x: 160, y: 21, radius: 13, interact: () => this.transitionTo(SceneId.HouseSittingRoom, HOUSE_SPAWNS[SceneId.HouseSittingRoom].bottom) });
    this.addInteraction({ id: 'nursery-cradle', kind: 'object', x: 139, y: 101, radius: 70, interact: () => this.say(houseDialogue.cradle) });
    this.addInteraction({ id: 'nursery-wall', kind: 'object', x: 260, y: 72, radius: 26, interact: () => this.say(houseDialogue.nurseryWall) });
    this.addInteraction({
      id: 'nursery-keeper',
      kind: 'npc',
      x: 272,
      y: 142,
      radius: 10,
      interact: () => this.talkToRoomKeeper(houseDialogue.nurseryArrival, houseDialogue.keeperPreservation),
    });
    if (this.sproutPresent) this.registerSproutInteraction();
  }

  private installSprout(): void {
    if (this.sproutPresent) return;
    this.sproutPresent = true;
    this.addSprout(46, 142);
  }

  private registerSproutInteraction(): void {
    this.addInteraction({
      id: 'nursery-sprout',
      kind: 'npc',
      x: 46,
      y: 142,
      radius: 10,
      interact: () => this.talkToHouseSprout(
        stateStore.snapshot.house.starOutcome ? houseDialogue.sproutAfterPhoto : houseDialogue.sproutRepeat,
      ),
    });
  }
}
