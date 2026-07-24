# Moonveil

Moonveil is an original, compact dream-RPG vertical slice built with Phaser 3 and TypeScript. It includes **The Chair in the Dark** prologue and **The Violet Garden** chapter.

The project takes inspiration from the emotional contrast and intimate overworld exploration of surreal RPGs, while using original characters, dialogue, visuals, audio, and code.

## Run it

Requirements: Node.js 20.19 or newer.

- Install: `npm install`
- Develop: `npm run dev`
- Production build: `npm run build`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Unit tests: `npm test`
- Browser tests: `npm run test:e2e`

## Controls

- Move freely: Arrow keys or WASD
- Sprint: Shift
- Interact/advance: Z, Enter, or Space
- Dialogue choices: Up/Down and Z/Enter/Space, or mouse
- Open/close POCKET: I (X or Escape also closes it)
- Sound and reduced-motion toggles appear in the upper-right corner

Movement is continuous and pixel-based, not tile-locked. Diagonal speed is normalized, collision is resolved by Phaser Arcade Physics, facing remains four-directional, and the step counter derives steps from actual distance traveled.

## Included sequence

1. Walk beyond the white patch three times as the room changes.
2. Meet Moth and ask all three questions in any order.
3. Follow the path into Violet Garden.
4. Speak with Moth and Sprout, examine the quiet pond, and listen when only the grass answers.
5. Find the Sleeping Star, take it after its final line, observe the consequence, and leave through the awakened arch.

Progress is stored in one versioned browser save slot. Autosaves occur after consequential interactions and scene transitions. A corrupted save is discarded safely. POCKET displays Soft Candy and adds the Sleeping Star once it has been found.

## Architecture

- `GameStateStore` owns typed narrative state and idempotent consequences.
- `SaveService` handles validation, migration, reset, and localStorage persistence.
- `Dreamer` provides smooth eight-direction input, four-direction facing, animation, collision, and distance tracking.
- `InteractionSystem` ranks nearby targets by facing, distance, and NPC priority.
- `DialogueSystem` presents accessible, animated DOM dialogue above the canvas.
- `InventoryOverlay` presents the keyboard-accessible POCKET and locks movement while open.
- `AssetRegistry` generates fallback pixel textures and resolves optional overrides.
- `AudioManager` synthesizes quiet ambience and cues after the browser audio gesture.

The scenes never mutate raw save data directly. Irreversible changes pass through typed state methods and are saved only after the effect resolves.

## Replace generated assets

Edit `public/assets/manifest.json` and map a logical key to a file under `public/assets`.

Image keys include:

- `dreamer-down-0`, `dreamer-down-1`, `dreamer-up-0`, `dreamer-up-1`
- `dreamer-left-0`, `dreamer-left-1`, `dreamer-right-0`, `dreamer-right-1`
- `chair`, `flower`, `flower-white`, `moth-0`, `moth-1`
- `sprout-0`, `sprout-1`, `star-0`, `star-1`, `arch-closed`, `arch-open`

Audio keys include:

- `step`, `dialogue-moth`, `dialogue-sprout`, `dialogue-world`
- `loop`, `path`, `star-hum`, `star-take`, `garden`

Example manifest entry:

```json
{
  "images": { "moth-0": "assets/moth-idle.png" },
  "audio": { "star-hum": "assets/star-hum.ogg" }
}
```

The generated fallback remains active for every key without an override. Keep replacement pixel art compact, transparent, and nearest-neighbor friendly.

## Scope

This milestone intentionally ends after Violet Garden. POCKET is a display-only story inventory; general item-use mechanics, combat, crafting, hunger, quest logs, status screens, naming, later chapters, and ending logic are not part of this slice.
