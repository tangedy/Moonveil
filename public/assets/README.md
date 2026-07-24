# Moonveil asset overrides

Moonveil generates its current minimalist art and sound at runtime. To replace a generated asset, add a PNG, OGG, or MP3 file in this folder and map its logical key in `manifest.json`.

Example:

- Image entry: `"moth-0": "assets/moth.png"`
- Audio entry: `"star-hum": "assets/star-hum.ogg"`

Image keys are documented in the project README. Replacement images are automatically scaled to the dimensions used by each scene. Keep pixel art free of smoothing and prefer transparent PNG files.

House overrides include Keeper’s two posture frames, stable and unstable passages, three portrait subjects, four photograph states, the wooden toy, Sprout’s leaf, and the living plant. Preserve the faceless silhouette direction and keep the plant’s green as the House chapter’s only new color accent.
