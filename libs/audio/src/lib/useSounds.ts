// ---------------------------------------------------------------------------
// useSounds – React hook wrapping SoundManager
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef } from 'react';
import { SoundManager, SoundEffect, SoundCategory } from './sound-manager';

export interface UseSoundsReturn {
  /** Play a one-shot sound effect. */
  play: (effect: SoundEffect) => void;
  /** Set volume for a sound category (0..1). */
  setVolume: (category: SoundCategory, volume: number) => void;
  /** Get current volume for a category. */
  getVolume: (category: SoundCategory) => number;
  /** Mute all audio. */
  mute: () => void;
  /** Unmute all audio. */
  unmute: () => void;
  /** Toggle mute state; returns new isMuted. */
  toggleMute: () => boolean;
  /** Whether audio is currently muted. */
  isMuted: () => boolean;
}

/**
 * Provides a stable API over a SoundManager instance.
 * Automatically initializes on mount and cleans up on unmount.
 *
 * @param manager - Optional existing SoundManager.  A new one is created if
 *                  omitted, but sharing one instance across the app is better.
 */
export function useSounds(manager?: SoundManager): UseSoundsReturn {
  const mgr = useRef(manager ?? new SoundManager()).current;

  useEffect(() => {
    mgr.initialize();
    return () => {
      mgr.cleanup();
    };
  }, [mgr]);

  const play = useCallback(
    (effect: SoundEffect) => {
      mgr.play(effect);
    },
    [mgr],
  );

  const setVolume = useCallback(
    (category: SoundCategory, volume: number) => {
      mgr.setVolume(category, volume);
    },
    [mgr],
  );

  const getVolume = useCallback(
    (category: SoundCategory) => mgr.getVolume(category),
    [mgr],
  );

  const mute = useCallback(() => mgr.mute(), [mgr]);
  const unmute = useCallback(() => mgr.unmute(), [mgr]);
  const toggleMute = useCallback(() => mgr.toggleMute(), [mgr]);
  const isMuted = useCallback(() => mgr.getIsMuted(), [mgr]);

  return { play, setVolume, getVolume, mute, unmute, toggleMute, isMuted };
}
