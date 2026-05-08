// ---------------------------------------------------------------------------
// HapticManager – game-specific haptic feedback for SallyCards
// ---------------------------------------------------------------------------
// Wraps expo-haptics with a high-level event-based API so game screens only
// need to call `hapticManager.trigger('card_play')` instead of choosing the
// right haptic pattern themselves.
// ---------------------------------------------------------------------------

import * as Haptics from 'expo-haptics';

// ---- Types -----------------------------------------------------------------

export type HapticEvent =
  | 'card_play'
  | 'card_capture'
  | 'victory'
  | 'defeat'
  | 'invalid_move'
  | 'announcement'
  | 'new_game'
  | 'message'
  | 'button_tap';

type HapticType =
  | { style: 'impact'; value: Haptics.ImpactFeedbackStyle }
  | { style: 'notification'; value: Haptics.NotificationFeedbackType }
  | { style: 'selection' };

// Map each game event to the most appropriate haptic feedback.
const EVENT_MAP: Record<HapticEvent, HapticType> = {
  card_play: { style: 'impact', value: Haptics.ImpactFeedbackStyle.Light },
  card_capture: { style: 'impact', value: Haptics.ImpactFeedbackStyle.Medium },
  victory: { style: 'notification', value: Haptics.NotificationFeedbackType.Success },
  defeat: { style: 'notification', value: Haptics.NotificationFeedbackType.Error },
  invalid_move: { style: 'notification', value: Haptics.NotificationFeedbackType.Warning },
  announcement: { style: 'impact', value: Haptics.ImpactFeedbackStyle.Heavy },
  new_game: { style: 'impact', value: Haptics.ImpactFeedbackStyle.Medium },
  message: { style: 'selection' },
  button_tap: { style: 'selection' },
};

// ---- HapticManager ---------------------------------------------------------

export class HapticManager {
  private enabled = true;

  /**
   * Fire the haptic pattern mapped to `event`.
   * No-ops gracefully if haptics are disabled or the platform doesn't support them.
   */
  trigger(event: HapticEvent): void {
    if (!this.enabled) return;

    const mapping = EVENT_MAP[event];
    if (!mapping) return;

    try {
      switch (mapping.style) {
        case 'impact':
          Haptics.impactAsync(mapping.value);
          break;
        case 'notification':
          Haptics.notificationAsync(mapping.value);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
      }
    } catch {
      // Platform doesn't support haptics – silently ignore.
    }
  }

  /**
   * Enable or disable haptic feedback globally.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check whether haptic feedback is currently enabled.
   */
  isHapticEnabled(): boolean {
    return this.enabled;
  }
}

// Default singleton.
export const hapticManager = new HapticManager();
