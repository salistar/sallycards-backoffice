/**
 * FallbackCard.tsx
 * Programmatic card rendering when no image asset is available.
 * Renders suit symbol, value text, and a colored background.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { Suit } from '@sally/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FallbackCardProps {
  suit: Suit | string;
  value: number;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Suit config
// ---------------------------------------------------------------------------

interface SuitConfig {
  symbol: string;
  color: string;
  backgroundColor: string;
}

const SUIT_CONFIG: Record<string, SuitConfig> = {
  // French suits
  hearts: { symbol: '\u2665', color: '#FFFFFF', backgroundColor: '#C41E3A' },
  diamonds: { symbol: '\u2666', color: '#FFFFFF', backgroundColor: '#C41E3A' },
  clubs: { symbol: '\u2663', color: '#FFFFFF', backgroundColor: '#1A1A2E' },
  spades: { symbol: '\u2660', color: '#FFFFFF', backgroundColor: '#1A1A2E' },
  // Spanish suits
  oros: { symbol: '\u2739', color: '#1A1A2E', backgroundColor: '#D4A843' },
  copas: { symbol: '\u2615', color: '#FFFFFF', backgroundColor: '#C41E3A' },
  espadas: { symbol: '\u2694', color: '#FFFFFF', backgroundColor: '#2D6A4F' },
  bastos: { symbol: '\u2618', color: '#FFFFFF', backgroundColor: '#2B4570' },
  // Okey colors
  red: { symbol: '\u25CF', color: '#FFFFFF', backgroundColor: '#C41E3A' },
  blue: { symbol: '\u25CF', color: '#FFFFFF', backgroundColor: '#2B4570' },
  green: { symbol: '\u25CF', color: '#FFFFFF', backgroundColor: '#2D6A4F' },
  black: { symbol: '\u25CF', color: '#FFFFFF', backgroundColor: '#1A1A2E' },
};

const DEFAULT_CONFIG: SuitConfig = {
  symbol: '?',
  color: '#FFFFFF',
  backgroundColor: '#555555',
};

// ---------------------------------------------------------------------------
// Value display
// ---------------------------------------------------------------------------

function formatValue(value: number): string {
  const FACE_CARDS: Record<number, string> = {
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K',
  };
  return FACE_CARDS[value] ?? String(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FallbackCard: React.FC<FallbackCardProps> = ({
  suit,
  value,
  width = 120,
  height = 180,
  style,
}) => {
  const config = SUIT_CONFIG[suit] ?? DEFAULT_CONFIG;
  const displayValue = formatValue(value);
  const fontSize = Math.min(width, height) * 0.18;
  const symbolSize = Math.min(width, height) * 0.3;

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: config.backgroundColor,
        },
        style,
      ]}
    >
      {/* Inner border */}
      <View style={styles.innerBorder}>
        {/* Top-left value */}
        <Text
          style={[
            styles.valueText,
            styles.topLeft,
            { color: config.color, fontSize },
          ]}
        >
          {displayValue}
        </Text>

        {/* Center suit symbol */}
        <Text
          style={[
            styles.centerSymbol,
            { color: config.color, fontSize: symbolSize },
          ]}
        >
          {config.symbol}
        </Text>

        {/* Bottom-right value (rotated 180) */}
        <Text
          style={[
            styles.valueText,
            styles.bottomRight,
            { color: config.color, fontSize },
          ]}
        >
          {displayValue}
        </Text>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBorder: {
    flex: 1,
    width: '90%',
    marginVertical: '5%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  valueText: {
    fontWeight: 'bold',
    position: 'absolute',
  },
  topLeft: {
    top: 6,
    left: 8,
  },
  bottomRight: {
    bottom: 6,
    right: 8,
    transform: [{ rotate: '180deg' }],
  },
  centerSymbol: {
    textAlign: 'center',
  },
});
