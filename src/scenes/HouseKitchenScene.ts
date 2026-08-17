import { houseDialogue } from '../content/houseWithoutDoors';
import { PALETTE, SceneId } from '../game/config';
import type { Position } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseKitchenScene extends HouseRoomScene {
  constructor() {
    super(SceneId.HouseKitchen, 'kitchen', 'The meal continues being warm at you.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseKitchen].left;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.violetDark);
    g.fillRoundedRect(78, 66, 148, 62, 8);
    g.fillStyle(PALETTE.paper, 0.34);
    g.fillRoundedRect(84, 72, 136, 50, 5);
    g.lineStyle(1, PALETTE.violetLight, 0.5);
    g.strokeRoundedRect(78, 66, 148, 62, 8);
    const plates = [[101, 82], [128, 80], [157, 79], [187, 82], [106, 109], [150, 112], [197, 108]] as const;
    plates.forEach(([x, y], index) => {
      g.fillStyle(index === 6 ? PALETTE.violetLight : PALETTE.paper, index === 6 ? 0.62 : 0.8);
      g.fillEllipse(x, y, 15, 7);
      g.fillStyle(PALETTE.violetDeep, 0.8);
      g.fillEllipse(x, y, 8, 3);
    });
    g.fillStyle(PALETTE.paper, 0.16);
    for (let y = 0; y < 4; y += 1) {
      g.fillCircle(119 + y * 19, 53 - (y % 2) * 5, 7 + y);
    }

    g.fillStyle(PALETTE.black);
    g.fillRect(247, 82, 28, 28);
    g.lineStyle(2, PALETTE.violetLight, 0.5);
    g.strokeRect(251, 86, 20, 20);
    g.lineBetween(270, 91, 278, 91);

    this.addKeeper(256, 139);
    this.addPassage(20, 116, true, Math.PI);
    this.addCollider(152, 98, 154, 68);
    this.addCollider(261, 98, 34, 34);
  }

  protected registerRoomInteractions(): void {
    this.addInteraction({ id: 'kitchen-bedroom', kind: 'object', x: 20, y: 116, radius: 12, interact: () => this.transitionTo(SceneId.HouseBedroom, HOUSE_SPAWNS[SceneId.HouseBedroom].right) });
    this.addInteraction({ id: 'kitchen-table', kind: 'object', x: 152, y: 98, radius: 68, interact: () => this.say(houseDialogue.kitchenTable) });
    this.addInteraction({ id: 'kitchen-meal', kind: 'object', x: 151, y: 58, radius: 30, interact: () => this.say(houseDialogue.warmMeal) });
    this.addInteraction({ id: 'kitchen-cup', kind: 'object', x: 261, y: 98, radius: 17, interact: () => this.say(houseDialogue.brokenCup) });
    this.addInteraction({
      id: 'kitchen-keeper',
      kind: 'npc',
      x: 256,
      y: 139,
      radius: 10,
      interact: () => this.talkToRoomKeeper(houseDialogue.kitchenArrival, houseDialogue.breadAfter),
    });
  }
}
