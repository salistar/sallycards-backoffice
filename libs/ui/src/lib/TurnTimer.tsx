// ---------------------------------------------------------------------------
// TurnTimer – circular countdown indicator with colour transitions & pulse
// ---------------------------------------------------------------------------

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

// ---- Types -----------------------------------------------------------------

export interface TurnTimerProps {
  /** Total time in seconds for this turn. */
  duration: number;
  /** Seconds remaining (controlled externally). */
  remaining: number;
  /** Called when the timer reaches 0. */
  onExpire?: () => void;
  /** Diameter of the circular indicator (default 64). */
  size?: number;
  /** Stroke width (default 5). */
  strokeWidth?: number;
  /** Whether to show the numeric countdown in the centre (default true). */
  showLabel?: boolean;
}

// ---- Colour helpers --------------------------------------------------------

function timerColor(fraction: number): string {
  // green -> yellow -> red
  if (fraction > 0.5) return '#2E7D52'; // green
  if (fraction > 0.2) return '#D4AF37'; // yellow / gold
  return '#C62828'; // red
}

// ---- Component -------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function TurnTimer({
  duration,
  remaining,
  onExpire,
  size = 64,
  strokeWidth = 5,
  showLabel = true,
}: TurnTimerProps) {
  const fraction = duration > 0 ? remaining / duration : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - fraction);

  // Pulse animation for last 5 seconds
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevRemaining = useRef(remaining);

  useEffect(() => {
    if (remaining <= 5 && remaining > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (remaining > 5) {
      // Reset pulse when time is above 5 seconds
      pulseAnim.setValue(1);
    }
  }, [remaining, pulseAnim]);

  // Fire onExpire when crossing from >0 to 0
  useEffect(() => {
    if (prevRemaining.current > 0 && remaining <= 0) {
      onExpire?.();
    }
    prevRemaining.current = remaining;
  }, [remaining, onExpire]);

  const color = timerColor(fraction);

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size, transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E3A5F"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.3}
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Centre label */}
      {showLabel && (
        <View style={[styles.labelContainer, { width: size, height: size }]}>
          <Text style={[styles.label, { color, fontSize: size * 0.3 }]}>
            {Math.ceil(Math.max(0, remaining))}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// ---- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
