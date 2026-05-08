import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TournamentDocument = Tournament & Document;

export interface TournamentEntry {
  userId: string;
  displayName: string;
  bestScore: number;
  bestMoves: number;
  bestDurationMs: number;
  attempts: number;
  joinedAt: number;
}

/**
 * Tournoi solitaire — daily ou weekly. Tous les inscrits jouent le même
 * deal (déterministe) et sont classés par score (puis temps, puis coups).
 *
 * Prizes virtuels : `prizes` est un array de { rank, gold } ; le service
 * déclenche la distribution à la fin du tournoi (cron / manual close).
 */
@Schema({ timestamps: true, collection: 'tournaments' })
export class Tournament {
  @ApiProperty({ description: 'Code court (DAILY-2026-04-30, WEEKLY-2026-W18)' })
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @ApiProperty({ description: 'Type : daily / weekly / monthly' })
  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly'] })
  type!: string;

  @ApiProperty({ description: 'Variante du jeu' })
  @Prop({ required: true })
  variant!: string;

  @ApiProperty({ description: 'Difficulté' })
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'État initial du deal partagé' })
  @Prop({ type: Object, required: true })
  initialState!: any;

  @ApiProperty({ description: 'Hash du deal (pour matching deal-seeds)' })
  @Prop()
  dealHash?: string;

  @ApiProperty({ description: 'Liste des inscrits + scores' })
  @Prop({ type: [Object], default: [] })
  entries!: TournamentEntry[];

  @ApiProperty({ description: 'Récompenses { rank, goldGold }' })
  @Prop({ type: [Object], default: [] })
  prizes!: { rank: number; gold: number }[];

  @ApiProperty({ description: 'Status: open (inscriptions) / running / closed' })
  @Prop({ enum: ['open', 'running', 'closed'], default: 'open', index: true })
  status!: string;

  @ApiProperty({ description: 'Timestamp de début de la fenêtre' })
  @Prop({ type: Number, required: true })
  startsAt!: number;

  @ApiProperty({ description: 'Timestamp de fin de la fenêtre' })
  @Prop({ type: Number, required: true })
  endsAt!: number;
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);
TournamentSchema.index({ status: 1, type: 1, startsAt: -1 });
