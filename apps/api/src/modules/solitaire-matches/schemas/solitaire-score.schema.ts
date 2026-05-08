import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SolitaireScoreDocument = SolitaireScore & Document;

/**
 * Score d'une partie solo gagnée. Soumis par le mobile via POST /score-submit
 * et utilisé pour aggreger le leaderboard global par variante.
 */
@Schema({ timestamps: true, collection: 'solitaire_scores' })
export class SolitaireScore {
  @ApiProperty({ description: 'ID utilisateur (peut être anonyme/guest)' })
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty({ description: 'Pseudo affichage' })
  @Prop({ required: true })
  displayName!: string;

  @ApiProperty({ description: 'Variante (klondike-1, spider-2, ...)' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty({ description: 'Difficulté' })
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Score final' })
  @Prop({ required: true, type: Number })
  score!: number;

  @ApiProperty({ description: 'Nombre de coups' })
  @Prop({ required: true, type: Number })
  moves!: number;

  @ApiProperty({ description: 'Durée en ms' })
  @Prop({ required: true, type: Number })
  durationMs!: number;

  @ApiProperty({ description: 'A gagné ? (en général true pour leaderboard)' })
  @Prop({ default: true })
  won!: boolean;
}

export const SolitaireScoreSchema = SchemaFactory.createForClass(SolitaireScore);
SolitaireScoreSchema.index({ variant: 1, score: -1 });
SolitaireScoreSchema.index({ variant: 1, durationMs: 1 });
SolitaireScoreSchema.index({ userId: 1, variant: 1 });
