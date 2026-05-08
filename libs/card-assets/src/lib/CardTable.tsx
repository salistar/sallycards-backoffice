/**
 * CardTable.tsx
 * Game table component that arranges players, table cards,
 * and the current player's hand based on the number of players.
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import type { Player, Card } from '@sally/types';
import { AnimatedCard } from './AnimatedCard';
import { CardBack } from './CardBack';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type TableLayout = '2p' | '3p' | '4p';

export interface CardTableProps {
  players: Player[];
  currentPlayerId: string;
  tableCards: Card[];
  playerHand: Card[];
  onCardPlay: (card: Card) => void;
  layout: TableLayout;
  playableCardIds?: Set<string>;
  selectedCardId?: string | null;
  cardBackDesign?: 1 | 2 | 3 | 4 | 5;
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

interface PlayerPosition {
  player: Player;
  style: ViewStyle;
  label: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right';
}

function getPlayerPositions(
  players: Player[],
  currentPlayerId: string,
  layout: TableLayout,
): PlayerPosition[] {
  // Reorder so current player is at index 0
  const currentIndex = players.findIndex((p) => p.id === currentPlayerId);
  const ordered = [
    ...players.slice(currentIndex),
    ...players.slice(0, currentIndex),
  ];

  switch (layout) {
    case '2p': {
      const positions: PlayerPosition[] = [];
      if (ordered[1]) {
        positions.push({ player: ordered[1], style: layoutStyles.top, label: 'top' });
      }
      // Current player is always at bottom (rendered separately as hand)
      return positions;
    }
    case '3p': {
      const positions: PlayerPosition[] = [];
      if (ordered[1]) {
        positions.push({ player: ordered[1], style: layoutStyles.topLeft, label: 'top-left' });
      }
      if (ordered[2]) {
        positions.push({ player: ordered[2], style: layoutStyles.topRight, label: 'top-right' });
      }
      return positions;
    }
    case '4p': {
      const positions: PlayerPosition[] = [];
      if (ordered[1]) {
        positions.push({ player: ordered[1], style: layoutStyles.left, label: 'left' });
      }
      if (ordered[2]) {
        positions.push({ player: ordered[2], style: layoutStyles.top, label: 'top' });
      }
      if (ordered[3]) {
        positions.push({ player: ordered[3], style: layoutStyles.right, label: 'right' });
      }
      return positions;
    }
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface OpponentHandProps {
  player: Player;
  cardCount: number;
  isActive: boolean;
  position: PlayerPosition;
  cardBackDesign: 1 | 2 | 3 | 4 | 5;
}

const OpponentHand: React.FC<OpponentHandProps> = ({
  player,
  cardCount,
  isActive,
  position,
  cardBackDesign,
}) => {
  const isVertical = position.label === 'left' || position.label === 'right';
  const miniCardW = 40;
  const miniCardH = 60;
  const overlap = 15;

  return (
    <View
      style={[
        position.style,
        styles.opponentContainer,
        isActive && styles.activePlayerBorder,
      ]}
    >
      <Text style={[styles.playerName, isActive && styles.activePlayerName]}>
        {player.username}
      </Text>
      <View
        style={[
          styles.opponentCards,
          isVertical && styles.opponentCardsVertical,
        ]}
      >
        {Array.from({ length: Math.min(cardCount, 7) }).map((_, i) => (
          <View
            key={i}
            style={[
              isVertical
                ? { marginTop: i === 0 ? 0 : -overlap }
                : { marginLeft: i === 0 ? 0 : -overlap },
            ]}
          >
            <CardBack design={cardBackDesign} width={miniCardW} height={miniCardH} />
          </View>
        ))}
        {cardCount > 7 && (
          <Text style={styles.cardCountOverflow}>+{cardCount - 7}</Text>
        )}
      </View>
      {!player.isConnected && (
        <Text style={styles.disconnected}>Disconnected</Text>
      )}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const CardTable: React.FC<CardTableProps> = ({
  players,
  currentPlayerId,
  tableCards,
  playerHand,
  onCardPlay,
  layout,
  playableCardIds,
  selectedCardId,
  cardBackDesign = 4,
}) => {
  const positions = useMemo(
    () => getPlayerPositions(players, currentPlayerId, layout),
    [players, currentPlayerId, layout],
  );

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isCurrentPlayerActive =
    players.find((p) => p.id === currentPlayerId)?.isReady ?? false;

  // Assume each opponent has some cards (server would provide exact count)
  // For now, use a placeholder count based on hand size
  const opponentCardCount = playerHand.length;

  return (
    <View style={styles.table}>
      {/* Opponent hands */}
      {positions.map((pos) => (
        <OpponentHand
          key={pos.player.id}
          player={pos.player}
          cardCount={opponentCardCount}
          isActive={pos.player.isReady}
          position={pos}
          cardBackDesign={cardBackDesign}
        />
      ))}

      {/* Center: table cards */}
      <View style={styles.centerArea}>
        {tableCards.length === 0 ? (
          <Text style={styles.emptyTableText}>Play a card</Text>
        ) : (
          <View style={styles.tableCardRow}>
            {tableCards.map((card) => (
              <View key={card.id} style={styles.tableCardWrapper}>
                <AnimatedCard
                  suit={card.suit}
                  value={card.value}
                  deck={card.deck}
                  isRevealed={true}
                  isSelected={false}
                  isPlayable={false}
                  width={80}
                  height={120}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bottom: current player's hand */}
      <View
        style={[
          styles.handArea,
          isCurrentPlayerActive && styles.activePlayerBorder,
        ]}
      >
        {currentPlayer && (
          <Text style={[styles.playerName, styles.currentPlayerName]}>
            {currentPlayer.username} (You)
          </Text>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handScroll}
        >
          {playerHand.map((card) => {
            const isPlayable = playableCardIds
              ? playableCardIds.has(card.id)
              : true;
            const isSelected = selectedCardId === card.id;

            return (
              <View key={card.id} style={styles.handCardWrapper}>
                <AnimatedCard
                  suit={card.suit}
                  value={card.value}
                  deck={card.deck}
                  isRevealed={true}
                  isSelected={isSelected}
                  isPlayable={isPlayable}
                  width={90}
                  height={135}
                  cardBackDesign={cardBackDesign}
                  onPress={() => onCardPlay(card)}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ACTIVE_BORDER_COLOR = '#C9A84C';

const styles = StyleSheet.create({
  table: {
    flex: 1,
    backgroundColor: '#0B3D1C',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  // Opponent positions
  opponentContainer: {
    position: 'absolute',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  opponentCards: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opponentCardsVertical: {
    flexDirection: 'column',
  },
  activePlayerBorder: {
    borderWidth: 2,
    borderColor: ACTIVE_BORDER_COLOR,
    shadowColor: ACTIVE_BORDER_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  playerName: {
    color: '#CCCCCC',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  activePlayerName: {
    color: ACTIVE_BORDER_COLOR,
  },
  currentPlayerName: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  disconnected: {
    color: '#FF6B6B',
    fontSize: 10,
    marginTop: 2,
  },
  cardCountOverflow: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.7,
  },
  // Center area
  centerArea: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    bottom: '35%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  emptyTableText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
  },
  tableCardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tableCardWrapper: {
    margin: 4,
  },
  // Player hand
  handArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  handScroll: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  handCardWrapper: {
    marginHorizontal: -8, // Overlap cards slightly
  },
});

// Position styles for different layouts
const layoutStyles = StyleSheet.create({
  top: {
    top: 10,
    left: '50%',
    transform: [{ translateX: -80 }],
  },
  topLeft: {
    top: 10,
    left: '20%',
  },
  topRight: {
    top: 10,
    right: '20%',
  },
  left: {
    top: '35%',
    left: 10,
  },
  right: {
    top: '35%',
    right: 10,
  },
});
