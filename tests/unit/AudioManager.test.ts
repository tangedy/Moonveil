import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { AudioManager } from '../../src/audio/AudioManager';

describe('AudioManager', () => {
  it('keeps the same House ambience playing across scene attachments', () => {
    const sound = {
      isPlaying: true,
      play: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      setVolume: vi.fn(),
    };
    const add = vi.fn(() => sound);
    const makeScene = () => ({
      cache: { audio: { exists: () => true } },
      sound: { add },
    }) as unknown as Phaser.Scene;
    const audio = new AudioManager();

    audio.attach(makeScene());
    audio.startHouseAmbience();
    audio.attach(makeScene());
    audio.startHouseAmbience();

    expect(add).toHaveBeenCalledTimes(1);
    expect(sound.play).toHaveBeenCalledTimes(1);
    expect(sound.stop).not.toHaveBeenCalled();

    audio.stopAmbience();
    expect(sound.stop).toHaveBeenCalledTimes(1);
    expect(sound.destroy).toHaveBeenCalledTimes(1);
  });
});
