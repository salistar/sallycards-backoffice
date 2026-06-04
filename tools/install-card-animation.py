# -*- coding: utf-8 -*-
"""
install-card-animation.py — Install Reanimated card animation hook in 11 apps.

Creates src/utils/useCardAnimation.ts with:
  - useCardFlip()  : 3D flip with cardinal sign on tap (300ms spring)
  - useCardMove()  : translate-with-spring to (x,y) coords
  - useCardDeal()  : sequential deal animation from deck position
  - useCardWin()   : scale + glow celebration
"""
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\apps-deploy")
APPS = ['belote', 'okey', 'quiestce', 'scopa', 'tarot', 'solitaire',
        'kdoub', 'poker', 'ronda', 'concentration', 'kantcopy']

HOOK = '''/**
 * @file useCardAnimation.ts
 * @description Reanimated v3 primitives for card animations.
 * Defensive — if reanimated is missing, returns no-op handlers.
 *
 * Usage in game/local.tsx:
 *   const { flipStyle, flipCard, moveStyle, moveTo, dealStyle, deal, winStyle, celebrate }
 *     = useCardAnimation();
 *   <Animated.View style={flipStyle}><CardImage /></Animated.View>
 */
import { useCallback, useMemo } from 'react';

// Defensive import — Metro won't crash if missing
let useSharedValue: any, useAnimatedStyle: any, withSpring: any, withTiming: any,
    withSequence: any, withDelay: any, Easing: any, interpolate: any, runOnJS: any;
try {
  const r = require('react-native-reanimated');
  useSharedValue   = r.useSharedValue;
  useAnimatedStyle = r.useAnimatedStyle;
  withSpring       = r.withSpring;
  withTiming       = r.withTiming;
  withSequence     = r.withSequence;
  withDelay        = r.withDelay;
  Easing           = r.Easing;
  interpolate      = r.interpolate;
  runOnJS          = r.runOnJS;
} catch {}

const NOOP_STYLE = {};

export function useCardAnimation() {
  // If reanimated missing, return no-op handlers
  if (!useSharedValue) {
    return {
      flipStyle: NOOP_STYLE,
      flipCard: () => {},
      moveStyle: NOOP_STYLE,
      moveTo: () => {},
      dealStyle: NOOP_STYLE,
      deal: () => {},
      winStyle: NOOP_STYLE,
      celebrate: () => {},
      loseStyle: NOOP_STYLE,
      shake: () => {},
    };
  }

  // ============ FLIP ============
  const rotateY = useSharedValue(0);
  const flipStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
  }));
  const flipCard = useCallback((toFront: boolean = true) => {
    rotateY.value = withSpring(toFront ? 0 : 180, {
      damping: 18, stiffness: 200, mass: 0.6,
    });
  }, [rotateY]);

  // ============ MOVE ============
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const moveStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
    ],
  }));
  const moveTo = useCallback((x: number, y: number, duration: number = 400) => {
    tx.value = withSpring(x, { damping: 14, stiffness: 120 });
    ty.value = withSpring(y, { damping: 14, stiffness: 120 });
  }, [tx, ty]);

  // ============ DEAL (slide in from off-screen) ============
  const dealX = useSharedValue(-300);
  const dealY = useSharedValue(-200);
  const dealOpacity = useSharedValue(0);
  const dealStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dealX.value }, { translateY: dealY.value }],
    opacity: dealOpacity.value,
  }));
  const deal = useCallback((delayMs: number = 0) => {
    dealOpacity.value = withDelay(delayMs, withTiming(1, { duration: 200 }));
    dealX.value = withDelay(delayMs, withSpring(0, { damping: 14, stiffness: 140 }));
    dealY.value = withDelay(delayMs, withSpring(0, { damping: 14, stiffness: 140 }));
  }, [dealX, dealY, dealOpacity]);

  // ============ WIN (celebrate scale + rotation) ============
  const winScale = useSharedValue(1);
  const winRotate = useSharedValue(0);
  const winStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: winScale.value },
      { rotate: `${winRotate.value}deg` },
    ],
  }));
  const celebrate = useCallback(() => {
    winScale.value = withSequence(
      withTiming(1.25, { duration: 200 }),
      withTiming(1.0, { duration: 200 }),
      withTiming(1.15, { duration: 200 }),
      withTiming(1.0, { duration: 200 }),
    );
    winRotate.value = withSequence(
      withTiming(-8, { duration: 150 }),
      withTiming(8, { duration: 150 }),
      withTiming(-5, { duration: 150 }),
      withTiming(0, { duration: 150 }),
    );
  }, [winScale, winRotate]);

  // ============ LOSE (shake) ============
  const shakeX = useSharedValue(0);
  const loseStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const shake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-15, { duration: 60 }),
      withTiming(15, { duration: 60 }),
      withTiming(-12, { duration: 60 }),
      withTiming(12, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  }, [shakeX]);

  return {
    flipStyle, flipCard,
    moveStyle, moveTo,
    dealStyle, deal,
    winStyle, celebrate,
    loseStyle, shake,
  };
}

/**
 * Convenience: hook for a whole "card play" event (flip + move + sound + haptic).
 * Combine with useTactileFeedback() from audioHaptics.ts.
 */
export function useCardPlayChoreography() {
  const { flipStyle, flipCard, moveStyle, moveTo, winStyle, celebrate, loseStyle, shake } = useCardAnimation();
  return {
    flipStyle, moveStyle, winStyle, loseStyle,
    playCard: (toX: number, toY: number) => {
      flipCard(true);
      moveTo(toX, toY);
    },
    onWin:  celebrate,
    onLose: shake,
  };
}
'''

for app in APPS:
    dest = ROOT / f"sally-{app}" / "src" / "utils" / "useCardAnimation.ts"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(HOOK, encoding='utf-8')
    mono = ROOT.parent / "apps" / "mobile" / app / "src" / "utils" / "useCardAnimation.ts"
    if mono.parent.parent.exists():
        mono.parent.mkdir(parents=True, exist_ok=True)
        mono.write_text(HOOK, encoding='utf-8')
    print(f"  OK {app}: useCardAnimation.ts created")

print(f"\nDONE — installed in {len(APPS)} apps")
