// ---------------------------------------------------------------------------
// ScoreDisplay – animated score counter with player avatars & leader highlight
// ---------------------------------------------------------------------------

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

// ---- Types -----------------------------------------------------------------

export interface PlayerScore {
  id: string;
  name: string;
  avatar?: string;
  score: number;
}

export interface ScoreDisplayProps {
  /** Ordered list of player scores. */
  players: PlayerScore[];
  /** Whether to highlight the player with the highest score (default true). */
  highlightLeader?: boolean;
  /** Layout direction (default 'row'). */
  layout?: 'row' | 'column';
}

// ---- Animated number -------------------------------------------------------

function AnimatedScore({ value, isLeader }: { value: number; isLeader: boolean }) {
  const animatedValue = useRef(new Animated.Value(value)).current;
  const displayValue = useRef(value);
  const textRef = useRef<Text>(null);

  // Bounce effect when score changes
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const prev = displayValue.current;
    if (prev !== value) {
      displayValue.current = value;

      // Animate the number (visual bounce)
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // Animate the underlying value for smooth number roll
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [value, scaleAnim, animatedValue]);

  // We listen to the animated value to update the text display.
  // Since Animated.Value can't directly drive Text children in RN,
  // we use a listener + state.
  const [displayText, setDisplayText] = React.useState(value.toString());

  useEffect(() => {
    const id = animatedValue.addListener(({ value: v }) => {
      setDisplayText(Math.round(v).toString());
    });
    return () => animatedValue.removeListener(id);
  }, [animatedValue]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Text
        ref={textRef}
        style={[
          styles.scoreValue,
          isLeader && styles.scoreValueLeader,
        ]}
      >
        {displayText}
      </Text>
    </Animated.View>
  );
}

// ---- Avatar placeholder ----------------------------------------------------

function AvatarBubble({ name, avatar, isLeader }: { name: string; avatar?: string; isLeader: boolean }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.avatar, isLeader && styles.avatarLeader]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ---- Component -------------------------------------------------------------

export function ScoreDisplay({
  players,
  highlightLeader = true,
  layout = 'row',
}: ScoreDisplayProps) {
  const maxScore = Math.max(...players.map((p) => p.score), 0);

  return (
    <View
      style={[
        styles.container,
        layout === 'column' ? styles.containerColumn : styles.containerRow,
      ]}
    >
      {players.map((player) => {
        const isLeader =
          highlightLeader && player.score === maxScore && maxScore > 0;

        return (
          <View key={player.id} style={styles.playerCard}>
            <AvatarBubble
              name={player.name}
              avatar={player.avatar}
              isLeader={isLeader}
            />
            <Text
              style={[styles.playerName, isLeader && styles.playerNameLeader]}
              numberOfLines={1}
            >
              {player.name}
            </Text>
            <AnimatedScore value={player.score} isLeader={isLeader} />
          </View>
        );
      })}
    </View>
  );
}

// ---- Styles ----------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  containerColumn: {
    flexDirection: 'column',
    gap: 12,
  },
  playerCard: {
    alignItems: 'center',
    minWidth: 64,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarLeader: {
    borderColor: '#C9A84C',
    backgroundColor: '#2A4A6F',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  playerName: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 72,
  },
  playerNameLeader: {
    color: '#C9A84C',
    fontWeight: '700',
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  scoreValueLeader: {
    color: '#C9A84C',
  },
});
