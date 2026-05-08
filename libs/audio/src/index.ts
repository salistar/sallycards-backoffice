// @sally/audio
// Sound effects, music management, and haptic feedback for SallyCards.

// Sound Manager
export { SoundManager, soundManager } from './lib/sound-manager';
export type { SoundEffect, SoundCategory } from './lib/sound-manager';

// Sound Hook
export { useSounds } from './lib/useSounds';
export type { UseSoundsReturn } from './lib/useSounds';

// Haptic Manager
export { HapticManager, hapticManager } from './lib/haptic-manager';
export type { HapticEvent } from './lib/haptic-manager';

// Haptic Hook
export { useHaptics } from './lib/useHaptics';
export type { UseHapticsReturn } from './lib/useHaptics';
