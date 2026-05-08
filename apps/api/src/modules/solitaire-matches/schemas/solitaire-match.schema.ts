import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SolitaireMatchDocument = SolitaireMatch & Document;

export type SolitaireMatchStatus = 'waiting' | 'playing' | 'finished';

export interface PlayerProgress {
  userId: string;        // ID du joueur (peut être username pour anonyme)
  displayName: string;
  score: number;
  moves: number;
  finished: boolean;
  finishedAt: number | null; // timestamp ms
  joinedAt: number;
}

/**
 * Match 1v1 sur la même donne BD. Les 2 joueurs jouent en parallèle, le
 * premier qui gagne (ou avec le meilleur score si nul à temps) emporte.
 *
 * Synchro : pas de WebSocket pour la v1 — polling REST GET /status toutes
 * les 1.5s côté mobile. Suffisant pour un compteur de coups + score adverse.
 */
@Schema({ timestamps: true, collection: 'solitaire_matches' })
export class SolitaireMatch {
  @ApiProperty({ description: 'Code court (ex: ABCD12) pour rejoindre' })
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @ApiProperty({ description: 'Variante du jeu (klondike-1, spider-1, ...)' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty({ description: 'Difficulté' })
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'État initial partagé (depuis la BD ou local)' })
  @Prop({ type: Object, required: true })
  initialState!: any;

  @ApiProperty({ description: 'Hash du deal (pour matcher avec deal-seeds)' })
  @Prop({ index: true })
  dealHash?: string;

  @ApiProperty({ description: 'Status: waiting / playing / finished' })
  @Prop({ type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' })
  status!: SolitaireMatchStatus;

  @ApiProperty({ description: 'Joueurs' })
  @Prop({ type: [Object], default: [] })
  players!: PlayerProgress[];

  @ApiProperty({ description: 'Gagnant (userId) une fois finished' })
  @Prop({ type: String, default: null })
  winnerId!: string | null;

  @ApiProperty({ description: 'Timestamp du démarrage de la partie' })
  @Prop({ type: Number, default: null })
  startedAt!: number | null;

  @ApiProperty({ description: 'Timestamp de fin' })
  @Prop({ type: Number, default: null })
  finishedAt!: number | null;
}

export const SolitaireMatchSchema = SchemaFactory.createForClass(SolitaireMatch);
SolitaireMatchSchema.index({ status: 1, variant: 1, createdAt: -1 });
