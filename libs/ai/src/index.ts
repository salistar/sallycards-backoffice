// @sally/ai
// AI opponent engine for SallyCards single-player and bot-fill modes.

// Bot personality system
export {
  type BotPersonalityType,
  type BotDifficulty,
  type BotConfig,
  type BotProfile,
  BOT_PROFILES,
  getBotThinkDelay,
  selectBot,
  getAllBotProfiles,
  getBotProfile,
} from './lib/bot-personality';

// Bot engine base
export { type BotMoveResult, BotEngine } from './lib/bot-engine.base';

// MCTS
export { type MCTSNode, type MCTSGameAdapter, MCTS } from './lib/mcts/mcts';
export { MCTSBot } from './lib/mcts/mcts-bot';

// Random bot
export { RandomBot } from './lib/random-bot';

// Poker hand evaluator
export {
  type HandRank,
  type HandEvaluation,
  evaluateHand,
  compareHands,
  getHandStrength,
} from './lib/poker/hand-evaluator';

// Poker GTO ranges
export {
  type HandCategory,
  PREFLOP_RANGES,
  getHandNotation,
  getHandCategory,
  shouldPlayPreflop,
  getPreflopRaiseSize,
} from './lib/poker/gto-ranges';

// Poker bot
export { type PokerState, type PokerMove, PokerBot } from './lib/poker/poker-bot';

// Adaptive difficulty
export {
  type DifficultyAdjustments,
  AdaptiveDifficulty,
} from './lib/adaptive-difficulty';

// Bot dialogues
export {
  type DialogueLocale,
  type DialogueContext,
  getDialogue,
  getAllDialogues,
  resolveLocale,
} from './lib/bot-dialogues';

// Anti-cheat
export {
  type MoveRecord,
  type PlayerStats,
  type ValidationResult,
  type AntiCheatConfig,
  AntiCheat,
} from './lib/anti-cheat';
