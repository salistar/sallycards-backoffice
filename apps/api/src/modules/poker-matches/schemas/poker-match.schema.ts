import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PokerMatchDocument = PokerMatch & Document;
export type PokerMatchStatus = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';
export type PokerVariant = 'holdem' | 'omaha' | 'omahaHiLo' | 'fiveCardDraw' | 'sevenCardStud' | 'razz';
export type PokerFormat = 'cashGame' | 'sitngo' | 'mtt' | 'headsup';

export interface PokerPlayerProgress {
  userId: string;
  displayName: string;
  /** Solde de jetons virtuels (chips). NEVER real money — règlementation Maroc CNDP. */
  chips: number;
  /** Mise courante du round. */
  currentBet: number;
  /** Total misé sur la main courante. */
  totalBetThisHand: number;
  /** Action courante : check/bet/call/raise/fold/allin/null. */
  lastAction: string | null;
  /** Le joueur s'est-il couché (fold) sur cette main ? */
  folded: boolean;
  /** Le joueur est-il all-in ? */
  allIn: boolean;
  /** Position du joueur (0=BTN, 1=SB, 2=BB, ...). */
  position: number;
  joinedAt: number;
}

@Schema({ timestamps: true, collection: 'poker_matches' })
export class PokerMatch {
  @ApiProperty()
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @ApiProperty({ description: 'Variante (holdem, omaha, fiveCardDraw, ...)' })
  @Prop({ required: true, index: true })
  variant!: PokerVariant;

  @ApiProperty({ description: 'Format (cashGame, sitngo, mtt, headsup)' })
  @Prop({ required: true, default: 'cashGame' })
  format!: PokerFormat;

  @ApiProperty({ description: 'Petite blind (jetons virtuels)' })
  @Prop({ default: 10 })
  smallBlind!: number;

  @ApiProperty({ description: 'Grosse blind' })
  @Prop({ default: 20 })
  bigBlind!: number;

  @ApiProperty({ description: 'Buy-in (jetons d\'entrée pour SnG/MTT)' })
  @Prop({ default: 1000 })
  buyIn!: number;

  @ApiProperty({ description: 'Nombre max de joueurs (2 pour heads-up, 9 pour SnG)' })
  @Prop({ default: 9 })
  maxPlayers!: number;

  @ApiProperty()
  @Prop({ type: String, enum: ['waiting', 'preflop', 'flop', 'turn', 'river', 'showdown', 'finished'], default: 'waiting' })
  status!: PokerMatchStatus;

  @ApiProperty({ description: 'Pot courant de la main' })
  @Prop({ default: 0 })
  pot!: number;

  @ApiProperty({ description: 'Numéro de main (incrémenté à chaque deal)' })
  @Prop({ default: 0 })
  handNumber!: number;

  @ApiProperty({ description: 'Index du joueur dont c\'est le tour' })
  @Prop({ default: 0 })
  currentPlayerIdx!: number;

  @ApiProperty()
  @Prop({ type: [Object], default: [] })
  players!: PokerPlayerProgress[];

  @ApiProperty({ description: 'Gagnant de la main courante (userId)' })
  @Prop({ type: String, default: null })
  winnerId!: string | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  startedAt!: number | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  finishedAt!: number | null;
}

export const PokerMatchSchema = SchemaFactory.createForClass(PokerMatch);
PokerMatchSchema.index({ status: 1, variant: 1, format: 1, createdAt: -1 });
