/**
 * AnimatedCard.tsx
 * Animated playing card component with flip, scale-on-press,
 * glow when selected, and opacity when not playable.
 */

import React, { useEffect, useCallback } from 'react';
import {
  Pressable,
  Image,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { DeckType, Suit } from '@sally/types';
import { useCardAssets } from './useCardAssets';
import { FallbackCard } from './FallbackCard';
import { CardBack } from './CardBack';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AnimatedCardProps {
  suit: string;
  value: number;
  deck: string;
  isRevealed: boolean;
  isSelected: boolean;
  isPlayable: boolean;
  width?: number;
  height?: number;
  cardBackDesign?: 1 | 2 | 3 | 4 | 5;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 180;
const SELECTED_GLOW_COLOR = '#C9A84C';
const FLIP_DURATION = 400;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  suit,
  value,
  deck,
  isRevealed,
  isSelected,
  isPlayable,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  cardBackDesign = 4,
  onPress,
  onLongPress,
  style,
}) => {
  // Validate deck type - fallback to french52 if invalid
  const validDeck = (['spanish40', 'french52', 'french32', 'tarot78', 'okey106'].includes(deck)
    ? deck
    : 'french52') as DeckType;
  const { getCardImage } = useCardAssets(validDeck);

  // Shared animation values
  const flipProgress = useSharedValue(isRevealed ? 1 : 0);
  const pressScale = useSharedValue(1);

  // Drive flip animation when isRevealed changes
  useEffect(() => {
    flipProgress.value = withTiming(isRevealed ? 1 : 0, { duration: FLIP_DURATION });
  }, [isRevealed, flipProgress]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    if (!isPlayable) return;
    pressScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  }, [isPlayable, pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [pressScale]);

  const handlePress = useCallback(() => {
    if (!isPlayable || !onPress) return;
    onPress();
  }, [isPlayable, onPress]);

  // Front face animated style (visible when flipProgress = 1)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipProgress.value,
      [0, 0.5, 1],
      [180, 90, 0],
      Extrapolation.CLAMP,
    );
    const opacity = flipProgress.value >= 0.5 ? 1 : 0;

    return {
      transform: [
        { scale: pressScale.value },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Back face animated style (visible when flipProgress = 0)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(
      flipProgress.value,
      [0, 0.5, 1],
      [0, -90, -180],
      Extrapolation.CLAMP,
    );
    const opacity = flipProgress.value < 0.5 ? 1 : 0;

    return {
      transform: [
        { scale: pressScale.value },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity,
      backfaceVisibility: 'hidden' as const,
    };
  });

  // Container style combining glow + playability
  const containerStyle: ViewStyle = {
    width,
    height,
    borderRadius: 8,
    overflow: 'hidden',
    ...(isSelected && {
      borderWidth: 3,
      borderColor: SELECTED_GLOW_COLOR,
      shadowColor: SELECTED_GLOW_COLOR,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 10,
      elevation: 10,
    }),
    ...(!isPlayable && {
      opacity: 0.5,
    }),
  };

  const cardFaceSource = getCardImage(suit, value);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isPlayable}
      style={[containerStyle, style]}
    >
      {/* Front face */}
      <Animated.View style={[styles.face, { width, height }, frontAnimatedStyle]}>
        <Image
          source={cardFaceSource}
          style={styles.image}
          resizeMode="contain"
          onError={() => {
            // Image failed to load — FallbackCard is rendered below as backup
          }}
        />
        {/* Fallback rendered underneath; Image overlays when loaded */}
        <FallbackCard
          suit={suit as Suit}
          value={value}
          width={width}
          height={height}
          style={styles.fallbackUnderlay}
        />
      </Animated.View>

      {/* Back face */}
      <Animated.View style={[styles.face, styles.backFace, { width, height }, backAnimatedStyle]}>
        <CardBack design={cardBackDesign} width={width} height={height} />
      </Animated.View>
    </AnimatedPressable>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  backFace: {
    // Back face sits behind front face in the same position
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  fallbackUnderlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
});
