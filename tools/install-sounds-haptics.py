# -*- coding: utf-8 -*-
"""
install-sounds-haptics.py — Add shared useSound + useHaptics helper to all 11 apps.

Creates src/utils/audioHaptics.ts in each app with:
  - useCardSounds(): plays card-flip / click / win / lose via expo-av
  - useGameHaptics(): triggers light/medium/heavy + success/warning/error via expo-haptics

Both gracefully no-op if expo-av/expo-haptics aren't installed.
"""
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\apps-deploy")
APPS = ['belote', 'okey', 'quiestce', 'scopa', 'tarot', 'solitaire',
        'kdoub', 'poker', 'ronda', 'concentration', 'kantcopy']

HELPER_CONTENT = '''/**
 * @file audioHaptics.ts
 * @description Shared sound + haptics hooks for game UI.
 * Defensively imports expo-av and expo-haptics — no crash if missing.
 *
 * Usage:
 *   const { playFlip, playWin, playLose, playClick } = useCardSounds();
 *   const { light, medium, heavy, success, error } = useGameHaptics();
 */
import { useEffect, useRef, useCallback } from 'react';

// Defensive imports — Metro won't fail if these aren't installed
let Audio: any = null;
let Haptics: any = null;
try { Audio = require('expo-av').Audio; } catch {}
try { Haptics = require('expo-haptics'); } catch {}

type SoundKey = 'flip' | 'click' | 'win' | 'lose' | 'shuffle' | 'tick';

// Sounds resolved lazily. If asset missing, the play() is a no-op.
const SOUND_FILES: Partial<Record<SoundKey, any>> = {
  // Apps can drop these files into assets/sounds/<key>.mp3 — defensive require below
};

function loadSound(key: SoundKey): any {
  if (SOUND_FILES[key]) return SOUND_FILES[key];
  try {
    // Conditional require — works if file exists, returns null otherwise
    switch (key) {
      case 'flip':    return require('../../assets/sounds/flip.mp3');
      case 'click':   return require('../../assets/sounds/click.mp3');
      case 'win':     return require('../../assets/sounds/win.mp3');
      case 'lose':    return require('../../assets/sounds/lose.mp3');
      case 'shuffle': return require('../../assets/sounds/shuffle.mp3');
      case 'tick':    return require('../../assets/sounds/tick.mp3');
    }
  } catch { return null; }
}

export function useCardSounds(volume: number = 0.5) {
  const soundsRef = useRef<Record<string, any>>({});

  // Cleanup unloaded sounds
  useEffect(() => {
    return () => {
      Object.values(soundsRef.current).forEach((s: any) => {
        try { s?.unloadAsync?.(); } catch {}
      });
    };
  }, []);

  const play = useCallback(async (key: SoundKey) => {
    if (!Audio) return;
    const asset = loadSound(key);
    if (!asset) return;
    try {
      const { sound } = await Audio.Sound.createAsync(asset, { volume });
      soundsRef.current[key] = sound;
      await sound.playAsync();
      // Auto-unload after playback to free memory
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status?.didJustFinish) sound.unloadAsync().catch(() => {});
      });
    } catch {
      // silently no-op
    }
  }, [volume]);

  return {
    playFlip:    () => play('flip'),
    playClick:   () => play('click'),
    playWin:     () => play('win'),
    playLose:    () => play('lose'),
    playShuffle: () => play('shuffle'),
    playTick:    () => play('tick'),
  };
}

export function useGameHaptics() {
  const light    = useCallback(() => {
    try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);
  const medium   = useCallback(() => {
    try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch {}
  }, []);
  const heavy    = useCallback(() => {
    try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
  }, []);
  const success  = useCallback(() => {
    try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success); } catch {}
  }, []);
  const warning  = useCallback(() => {
    try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning); } catch {}
  }, []);
  const error    = useCallback(() => {
    try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Error); } catch {}
  }, []);
  const selection = useCallback(() => {
    try { Haptics?.selectionAsync?.(); } catch {}
  }, []);

  return { light, medium, heavy, success, warning, error, selection };
}

/**
 * Combined helper — call on any user-driven card play.
 * Plays flip sound + light haptic feedback.
 */
export function useTactileFeedback() {
  const sounds = useCardSounds();
  const haptics = useGameHaptics();

  return {
    onCardPlay:   () => { sounds.playFlip();    haptics.light(); },
    onCardSelect: () => { sounds.playClick();   haptics.selection(); },
    onWin:        () => { sounds.playWin();     haptics.success(); },
    onLose:       () => { sounds.playLose();    haptics.error(); },
    onShuffle:    () => { sounds.playShuffle(); haptics.medium(); },
    onTick:       () => { sounds.playTick();    haptics.selection(); },
  };
}
'''

for app in APPS:
    dest = ROOT / f"sally-{app}" / "src" / "utils" / "audioHaptics.ts"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(HELPER_CONTENT, encoding='utf-8')
    # Also mirror to mobile sources if exists
    mono = ROOT.parent / "apps" / "mobile" / app / "src" / "utils" / "audioHaptics.ts"
    if mono.parent.parent.exists():
        mono.parent.mkdir(parents=True, exist_ok=True)
        mono.write_text(HELPER_CONTENT, encoding='utf-8')
    print(f"  OK {app}: audioHaptics.ts created")

print(f"\nDONE — installed in {len(APPS)} apps")
print("\nNext steps for each app:")
print("  1. Add `expo-av` + `expo-haptics` to package.json (or use existing if present)")
print("  2. In game local.tsx, import: `import {{ useTactileFeedback }} from '../../src/utils/audioHaptics'`")
print("  3. Call `useTactileFeedback().onCardPlay()` on each card play")
print("  4. Drop .mp3 files into assets/sounds/ (royalty-free needed)")
