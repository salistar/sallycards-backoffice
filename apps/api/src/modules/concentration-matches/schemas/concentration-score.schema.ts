import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ConcentrationScoreDocument = ConcentrationScore & Document;

@Schema({ timestamps: true, collection: 'concentration_scores' })
export class ConcentrationScore {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true })
  displayName!: string;

  @ApiProperty({ description: 'Variante de grille (4x4, 6x6, ...)' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty()
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Score normalisé combinant moves+temps' })
  @Prop({ required: true, type: Number })
  score!: number;

  @ApiProperty({ description: 'Paires trouvées' })
  @Prop({ required: true, type: Number })
  pairsFound!: number;

  @ApiProperty({ description: 'Nombre de retournements' })
  @Prop({ required: true, type: Number })
  moves!: number;

  @ApiProperty({ description: 'Durée en ms' })
  @Prop({ required: true, type: Number })
  durationMs!: number;

  @ApiProperty()
  @Prop({ default: true })
  won!: boolean;
}

export const ConcentrationScoreSchema = SchemaFactory.createForClass(ConcentrationScore);
ConcentrationScoreSchema.index({ variant: 1, score: -1 });
ConcentrationScoreSchema.index({ variant: 1, moves: 1 });
ConcentrationScoreSchema.index({ variant: 1, durationMs: 1 });
ConcentrationScoreSchema.index({ userId: 1, variant: 1 });
