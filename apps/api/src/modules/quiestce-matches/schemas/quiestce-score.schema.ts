import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type QuiestceScoreDocument = QuiestceScore & Document;

/**
 * Score d'une partie Qui-est-ce ? gagnée. Le "score" est inversé : moins de
 * questions = meilleur score. On stocke aussi questionsAsked en clair pour
 * trier directement par "fewest questions".
 */
@Schema({ timestamps: true, collection: 'quiestce_scores' })
export class QuiestceScore {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true })
  displayName!: string;

  @ApiProperty({ description: 'Pack thématique' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty({ description: 'Difficulté' })
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Score normalisé (1000 - questionsAsked*10), minimum 0' })
  @Prop({ required: true, type: Number })
  score!: number;

  @ApiProperty({ description: 'Nombre de questions posées (moins = mieux)' })
  @Prop({ required: true, type: Number })
  questionsAsked!: number;

  @ApiProperty({ description: 'Durée en ms' })
  @Prop({ required: true, type: Number })
  durationMs!: number;

  @ApiProperty()
  @Prop({ default: true })
  won!: boolean;
}

export const QuiestceScoreSchema = SchemaFactory.createForClass(QuiestceScore);
QuiestceScoreSchema.index({ variant: 1, score: -1 });
QuiestceScoreSchema.index({ variant: 1, questionsAsked: 1 });
QuiestceScoreSchema.index({ variant: 1, durationMs: 1 });
QuiestceScoreSchema.index({ userId: 1, variant: 1 });
