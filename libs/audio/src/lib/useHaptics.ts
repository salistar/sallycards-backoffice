// ---------------------------------------------------------------------------
// useHaptics – React hook wrapping HapticManager
// ---------------------------------------------------------------------------

import { useCallback, useRef } from 'react';
import { HapticManager, HapticEvent } from './haptic-manager';

export interface UseHapticsReturn {
  /** Fire the haptic pattern for the given game event. */
  trigger: (event: HapticEvent) => void;
  /** Enable or disable haptic feedback. */
  setEnabled: (enabled: boolean) => void;
  /** Check whether haptics are currently enabled. */
  isEnabled: () => boolean;
}

/**
 * Provides a stable API over a HapticManager instance.
 *
 * @param manager - Optional existing HapticManager.  A new one is created if
 *                  omitted, but sharing one instance across the app is better.
 */
export function useHaptics(manager?: HapticManager): UseHapticsReturn {
  const mgr = useRef(manager ?? new HapticManager()).current;

  const trigger = useCallback(
    (event: HapticEvent) => {
      mgr.trigger(event);
    },
    [mgr],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      mgr.setEnabled(enabled);
    },
    [mgr],
  );

  const isEnabled = useCallback(() => mgr.isHapticEnabled(), [mgr]);

  return { trigger, setEnabled, isEnabled };
}
