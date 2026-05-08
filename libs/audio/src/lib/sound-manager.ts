// ---------------------------------------------------------------------------
// SoundManager – cross-platform sound effect & music playback for SallyCards
// ---------------------------------------------------------------------------
// Uses expo-av under the hood.  Callers interact only with the SoundManager
// singleton; the actual `Audio.Sound` loading is handled lazily.
// ---------------------------------------------------------------------------

import { Audio, AVPlaybackStatus } from 'expo-av';

// ---- Types -----------------------------------------------------------------

export type SoundEffect =
  | 'card_deal'
  | 'card_flip'
  | 'card_play'
  | 'card_capture'
  | 'ronda_announce'
  | 'tringa_announce'
  | 'win'
  | 'lose'
  | 'draw'
  | 'bot_think'
  | 'chat_message'
  | 'timer_warning'
  | 'button_tap'
  | 'error';

export type SoundCategory = 'effects' | 'music' | 'voice';

// Map each sound effect to a (lazy-loaded) asset path.
// In production these would be `require('./assets/sfx/card_deal.mp3')` etc.
// Using a Record so each entry can be swapped independently.
const SOUND_MAP: Record<SoundEffect, number | null> = {
  card_deal: null,
  card_flip: null,
  card_play: null,
  card_capture: null,
  ronda_announce: null,
  tringa_announce: null,
  win: null,
  lose: null,
  draw: null,
  bot_think: null,
  chat_message: null,
  timer_warning: null,
  button_tap: null,
  error: null,
};

// ---- SoundManager ----------------------------------------------------------

export class SoundManager {
  private volumes: Record<SoundCategory, number> = {
    effects: 1,
    music: 0.5,
    voice: 1,
  };

  private isMuted = false;
  private loaded: Map<SoundEffect, Audio.Sound> = new Map();
  private initialized = false;

  // ------------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------------

  /**
   * Pre-load the most frequently used sounds so the first play is instant.
   * Safe to call multiple times (idempotent).
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch {
      // Audio mode setting may fail in tests or web – non-fatal.
    }

    // Pre-load high-frequency effects
    const preload: SoundEffect[] = [
      'card_play',
      'card_deal',
      'card_flip',
      'button_tap',
    ];

    await Promise.all(preload.map((s) => this.ensureLoaded(s)));
    this.initialized = true;
  }

  /**
   * Release all loaded Audio.Sound instances.
   */
  async cleanup(): Promise<void> {
    const promises: Promise<void>[] = [];
    this.loaded.forEach((sound) => {
      promises.push(
        sound.unloadAsync().catch(() => {
          /* already unloaded */
        }),
      );
    });
    await Promise.all(promises);
    this.loaded.clear();
    this.initialized = false;
  }

  // ------------------------------------------------------------------
  // Playback
  // ------------------------------------------------------------------

  /**
   * Play a one-shot sound effect.  Resolves when playback starts (not ends).
   */
  async play(effect: SoundEffect): Promise<void> {
    if (this.isMuted) return;
    if (this.volumes.effects <= 0) return;

    const sound = await this.ensureLoaded(effect);
    if (!sound) return;

    try {
      await sound.setVolumeAsync(this.volumes.effects);
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      // Playback failure is non-fatal (e.g. on web preview).
    }
  }

  // ------------------------------------------------------------------
  // Volume
  // ------------------------------------------------------------------

  setVolume(category: SoundCategory, volume: number): void {
    this.volumes[category] = Math.max(0, Math.min(1, volume));
  }

  getVolume(category: SoundCategory): number {
    return this.volumes[category];
  }

  // ------------------------------------------------------------------
  // Mute
  // ------------------------------------------------------------------

  mute(): void {
    this.isMuted = true;
  }

  unmute(): void {
    this.isMuted = false;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  // ------------------------------------------------------------------
  // Internal
  // ------------------------------------------------------------------

  private async ensureLoaded(effect: SoundEffect): Promise<Audio.Sound | null> {
    if (this.loaded.has(effect)) return this.loaded.get(effect)!;

    const asset = SOUND_MAP[effect];
    if (asset === null) {
      // No asset mapped yet – return null silently.
      return null;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(asset as any, {
        shouldPlay: false,
        volume: this.volumes.effects,
      });
      this.loaded.set(effect, sound);
      return sound;
    } catch {
      return null;
    }
  }
}

// Default singleton for convenience (consumers can still create their own).
export const soundManager = new SoundManager();
