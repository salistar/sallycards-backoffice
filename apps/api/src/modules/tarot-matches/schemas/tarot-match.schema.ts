import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TarotMatchDocument = TarotMatch & Document;
export type TarotMatchStatus = 'waiting' | 'bidding' | 'playing' | 'finished';
export type TarotContract = 'pass' | 'petite' | 'garde' | 'gardeSans' | 'gardeContre';

const CONTRACT_MULTIPLIER: Record<TarotContract, number> = {
  pass: 0,
  petite: 1,
  garde: 2,
  gardeSans: 4,
  gardeContre: 6,
};

export interface TarotPlayerProgress {
  userId: string;
  displayName: string;
  /** Cartes capturées dans le tas (count). */
  trickCount: number;
  /** Score en points dans la donne courante (sur 91). */
  pointsCaptured: number;
  /** Bouts capturés (Petit + 21 + Excuse) — affecte l'objectif. */
  boutsCaptured: number;
  /** Score cumulé sur la partie (sur plusieurs donnes). */
  totalScore: number;
  finished: boolean;
  finishedAt: number | null;
  joinedAt: number;
}

@Schema({ timestamps: true, collection: 'tarot_matches' })
export class TarotMatch {
  @ApiProperty({ description: 'Code court' })
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @ApiProperty({ description: 'Variante (classic4p, classic3p, classic5p, scientifico)' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty({ description: '3, 4 ou 5 joueurs' })
  @Prop({ default: 4 })
  playerCount!: number;

  @ApiProperty({ description: 'ID du preneur (déclaré pendant les enchères)' })
  @Prop({ type: String, default: null })
  takerId!: string | null;

  @ApiProperty({ description: 'Contrat annoncé (petite, garde, gardeSans, gardeContre)' })
  @Prop({ type: String, default: 'pass' })
  contract!: TarotContract;

  @ApiProperty({ description: 'Multiplicateur du contrat (1, 2, 4, 6)' })
  @Prop({ default: 1 })
  contractMultiplier!: number;

  @ApiProperty({ description: 'Chelem annoncé ?' })
  @Prop({ default: false })
  chelemAnnounced!: boolean;

  @ApiProperty()
  @Prop({ type: String, enum: ['waiting', 'bidding', 'playing', 'finished'], default: 'waiting' })
  status!: TarotMatchStatus;

  @ApiProperty()
  @Prop({ type: [Object], default: [] })
  players!: TarotPlayerProgress[];

  @ApiProperty()
  @Prop({ type: String, default: null })
  winnerId!: string | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  startedAt!: number | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  finishedAt!: number | null;
}

export const TarotMatchSchema = SchemaFactory.createForClass(TarotMatch);
TarotMatchSchema.index({ status: 1, variant: 1, createdAt: -1 });

export { CONTRACT_MULTIPLIER };
