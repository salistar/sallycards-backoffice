import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ScopaScoreDocument = ScopaScore & Document;

@Schema({ timestamps: true, collection: 'scopa_scores' })
export class ScopaScore {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true })
  displayName!: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty()
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Score final (cartes + denari + settebello + primiera + scopas)' })
  @Prop({ required: true, type: Number })
  score!: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number })
  scopas!: number;

  @ApiProperty()
  @Prop({ default: false })
  settebello!: boolean;

  @ApiProperty()
  @Prop({ required: true, type: Number })
  durationMs!: number;

  @ApiProperty()
  @Prop({ default: true })
  won!: boolean;
}

export const ScopaScoreSchema = SchemaFactory.createForClass(ScopaScore);
ScopaScoreSchema.index({ variant: 1, score: -1 });
ScopaScoreSchema.index({ variant: 1, scopas: -1 });
ScopaScoreSchema.index({ userId: 1, variant: 1 });
