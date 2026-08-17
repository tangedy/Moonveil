import type Phaser from 'phaser';
import { houseDialogue } from '../content/houseWithoutDoors';
import { AudioCue, PALETTE, SceneId, TextureKey } from '../game/config';
import { assetRegistry, audioManager, saveService, stateStore } from '../game/services';
import type { Position } from '../state/GameState';
import { HOUSE_SPAWNS, HouseRoomScene } from './HouseRoomScene';

export class HouseUnkeptRoomScene extends HouseRoomScene {
  private leaf!: Phaser.GameObjects.Image;
  private plant!: Phaser.GameObjects.Image;
  private exitPassage!: Phaser.GameObjects.Image;

  constructor() {
    super(SceneId.HouseUnkeptRoom, 'unkept-room', 'Nothing here has decided what it used to be.');
  }

  protected defaultSpawn(): Position {
    return HOUSE_SPAWNS[SceneId.HouseUnkeptRoom].bottom;
  }

  protected buildRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.violetDark, 0.55);
    g.fillRect(50, 65, 91, 11);
    g.fillRect(50, 76, 11, 48);
    g.fillRect(118, 76, 23, 48);
    g.fillStyle(PALETTE.paper, 0.16);
    g.fillRect(64, 88, 118, 8);
    g.fillRect(174, 88, 8, 37);
    g.fillStyle(PALETTE.black, 0.65);
    g.fillRoundedRect(215, 51, 49, 65, 4);
    g.lineStyle(1, PALETTE.violetLight, 0.32);
    g.lineBetween(217, 57, 260, 102);
    g.lineBetween(260, 57, 217, 102);
    g.lineStyle(1, PALETTE.livingGreen, 0.28);
    for (let x = 65; x < 235; x += 24) g.lineBetween(x, 142, x + 8, 137 - (x % 7));

    this.addKeeper(258, 139);
    this.addSprout(72, 139);
    this.leaf = this.add.image(153, 128, assetRegistry.resolve(this, TextureKey.SproutLeaf))
      .setVisible(!stateStore.snapshot.house.leafPlanted)
      .setDepth(12);
    this.plant = this.add.image(153, 126, assetRegistry.resolve(this, TextureKey.HousePlant))
      .setVisible(stateStore.snapshot.house.leafPlanted)
      .setDepth(12);
    this.addPassage(160, 159, true, Math.PI / 2);
    this.exitPassage = this.addPassage(300, 116, true, 0, stateStore.snapshot.house.exitOpened ? 1 : 0);
    this.addCollider(95, 91, 99, 58);
    this.addCollider(238, 83, 53, 69);
  }

  protected registerRoomInteractions(): void {
    this.addInteraction({ id: 'unkept-hallway', kind: 'object', x: 160, y: 159, radius: 13, interact: () => this.transitionTo(SceneId.HouseHallway, HOUSE_SPAWNS[SceneId.HouseHallway].top) });
    this.addInteraction({ id: 'unkept-things', kind: 'object', x: 112, y: 91, radius: 45, interact: () => this.say(houseDialogue.unkeptObjects) });
    this.addInteraction({
      id: 'unkept-leaf',
      kind: 'object',
      x: 153,
      y: 128,
      radius: 12,
      interact: () => this.plantLeaf(),
    });
    this.addInteraction({
      id: 'unkept-keeper',
      kind: 'npc',
      x: 258,
      y: 139,
      radius: 10,
      interact: () => this.talkToRoomKeeper(
        houseDialogue.unkeptArrival,
        stateStore.snapshot.house.leafPlanted ? houseDialogue.plantRepeat : houseDialogue.unkeptArrival,
      ),
    });
    this.addInteraction({
      id: 'unkept-sprout',
      kind: 'npc',
      x: 72,
      y: 139,
      radius: 10,
      interact: () => this.talkToHouseSprout(
        stateStore.snapshot.house.leafPlanted ? houseDialogue.plantRepeat : houseDialogue.sproutAfterPhoto,
      ),
    });
    this.addInteraction({
      id: 'unkept-exit',
      kind: 'object',
      x: 300,
      y: 116,
      radius: 13,
      enabled: () => stateStore.snapshot.house.exitOpened,
      interact: () => this.finishHouse(),
    });
  }

  private async plantLeaf(): Promise<void> {
    if (stateStore.snapshot.house.leafPlanted) {
      await this.say(houseDialogue.plantRepeat);
      return;
    }
    await this.say(houseDialogue.leafPrompt);
    stateStore.plantHouseLeaf();
    this.checkpoint();
    this.leaf.setVisible(false);
    this.plant.setVisible(true).setScale(0.2);
    this.exitPassage.setAlpha(1);
    audioManager.cue(AudioCue.PlantGrowth);
    if (!stateStore.snapshot.preferences.reducedMotion) {
      this.tweens.add({ targets: this.plant, scale: 1, duration: 850, ease: 'Back.out' });
      this.tweens.add({ targets: this.exitPassage, alpha: { from: 0, to: 1 }, duration: 850 });
      await this.wait(880);
    } else {
      this.plant.setScale(1);
    }
    await this.say(houseDialogue.leafGrowth);
  }

  private async finishHouse(): Promise<void> {
    if (this.transitioning) return;
    this.transitioning = true;
    this.dreamer.setInputLocked(true);
    await this.say(houseDialogue.farewell);
    this.dreamer.setInputLocked(true);
    stateStore.completeHouse();
    saveService.save(stateStore.snapshot);
    audioManager.stopAmbience();
    this.cameras.main.fadeOut(900, 255, 250, 242);
    await this.wait(920);
    this.scene.start(SceneId.SliceEnd);
  }
}
