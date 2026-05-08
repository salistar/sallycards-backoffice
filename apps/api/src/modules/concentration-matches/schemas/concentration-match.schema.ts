import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ConcentrationMatchDocument = ConcentrationMatch & Document;

export type ConcentrationMatchStatus = 'waiting' | 'playing' | 'finished';

export interface ConcentrationPlayerProgress {
  userId: string;
  displayName: string;
  pairsFound: number;
  moves: number;     // nombre de retournements (chaque coup = 2 cartes)
  finished: boolean;
  finishedAt: number | null;
  joinedAt: number;
}

@Schema({ timestamps: true, collection: 'concentration_matches' })
export class ConcentrationMatch {
  @ApiProperty({ description: 'Code court (ex: ABCD12) pour rejoindre' })
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @ApiProperty({ description: 'Variante (4x4, 6x6, 8x8, 10x10)' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty({ description: 'Difficulté (easy/medium/hard)' })
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Layout partagé : ordre des cartes face cachée (déterministe)' })
  @Prop({ type: [String], default: [] })
  cardLayout!: string[];

  @ApiProperty({ description: 'Status: waiting / playing / finished' })
  @Prop({ type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' })
  status!: ConcentrationMatchStatus;

  @ApiProperty({ description: 'Joueurs' })
  @Prop({ type: [Object], default: [] })
  players!: ConcentrationPlayerProgress[];

  @ApiProperty({ description: 'Gagnant (userId) une fois finished' })
  @Prop({ type: String, default: null })
  winnerId!: string | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  startedAt!: number | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  finishedAt!: number | null;
}

export const ConcentrationMatchSchema = SchemaFactory.createForClass(ConcentrationMatch);
ConcentrationMatchSchema.index({ status: 1, variant: 1, createdAt: -1 });
