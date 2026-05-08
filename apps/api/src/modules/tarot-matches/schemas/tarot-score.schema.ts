import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TarotScoreDocument = TarotScore & Document;

@Schema({ timestamps: true, collection: 'tarot_scores' })
export class TarotScore {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true })
  displayName!: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty({ description: 'Contrat (petite/garde/gardeSans/gardeContre/pass)' })
  @Prop({ default: 'petite' })
  contract!: string;

  @ApiProperty({ description: 'Score final de la donne (peut être négatif si chuté)' })
  @Prop({ required: true, type: Number })
  score!: number;

  @ApiProperty({ description: 'Bouts capturés (0-3)' })
  @Prop({ default: 0, type: Number })
  boutsCaptured!: number;

  @ApiProperty({ description: 'Points sur 91' })
  @Prop({ required: true, type: Number })
  pointsCaptured!: number;

  @ApiProperty({ description: 'Chelem annoncé ?' })
  @Prop({ default: false })
  chelemAnnounced!: boolean;

  @ApiProperty({ description: 'Petit au bout (gagné/perdu) ?' })
  @Prop({ default: false })
  petitAuBout!: boolean;

  @ApiProperty()
  @Prop({ required: true, type: Number })
  durationMs!: number;

  @ApiProperty({ description: 'A gagné le contrat ?' })
  @Prop({ default: true })
  won!: boolean;
}

export const TarotScoreSchema = SchemaFactory.createForClass(TarotScore);
TarotScoreSchema.index({ variant: 1, score: -1 });
TarotScoreSchema.index({ userId: 1, variant: 1 });
