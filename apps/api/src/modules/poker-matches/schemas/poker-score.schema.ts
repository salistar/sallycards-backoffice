import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PokerScoreDocument = PokerScore & Document;

@Schema({ timestamps: true, collection: 'poker_scores' })
export class PokerScore {
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
  @Prop({ default: 'cashGame' })
  format!: string;

  @ApiProperty({ description: 'Profit/perte de la session (peut être négatif)' })
  @Prop({ required: true, type: Number })
  netProfit!: number;

  @ApiProperty({ description: 'Plus gros pot remporté de la session' })
  @Prop({ default: 0, type: Number })
  biggestPot!: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number })
  handsPlayed!: number;

  @ApiProperty()
  @Prop({ default: 0, type: Number })
  handsWon!: number;

  @ApiProperty({ description: 'Nb de Quintes Flush Royales' })
  @Prop({ default: 0, type: Number })
  royalFlushes!: number;

  @ApiProperty({ description: 'Bluffs réussis (auto-déclaré côté client)' })
  @Prop({ default: 0, type: Number })
  bluffsWon!: number;

  @ApiProperty()
  @Prop({ required: true, type: Number })
  durationMs!: number;
}

export const PokerScoreSchema = SchemaFactory.createForClass(PokerScore);
PokerScoreSchema.index({ variant: 1, netProfit: -1 });
PokerScoreSchema.index({ variant: 1, biggestPot: -1 });
PokerScoreSchema.index({ userId: 1, variant: 1 });
