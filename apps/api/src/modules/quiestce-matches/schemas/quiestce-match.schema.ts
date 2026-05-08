import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type QuiestceMatchDocument = QuiestceMatch & Document;

export type QuiestceMatchStatus = 'waiting' | 'playing' | 'finished';

export interface QuiestcePlayerProgress {
  userId: string;
  displayName: string;
  questionsAsked: number;
  finished: boolean;
  finishedAt: number | null;
  joinedAt: number;
  // ID of the secret character this player must guess (set by the opponent on join)
  secretCharacterId: string | null;
}

@Schema({ timestamps: true, collection: 'quiestce_matches' })
export class QuiestceMatch {
  @ApiProperty({ description: 'Code court (ex: ABCD12) pour rejoindre' })
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @ApiProperty({ description: 'Pack thématique (classic, maroc, sally, foot, ...)' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty({ description: 'Difficulté (easy=24 cartes, medium=36, hard=50)' })
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Pool de personnages distribués (ids du pack)' })
  @Prop({ type: [String], default: [] })
  characterPool!: string[];

  @ApiProperty({ description: 'Status: waiting / playing / finished' })
  @Prop({ type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' })
  status!: QuiestceMatchStatus;

  @ApiProperty({ description: 'Joueurs' })
  @Prop({ type: [Object], default: [] })
  players!: QuiestcePlayerProgress[];

  @ApiProperty({ description: 'Gagnant (userId) une fois finished' })
  @Prop({ type: String, default: null })
  winnerId!: string | null;

  @ApiProperty({ description: 'Timestamp du démarrage' })
  @Prop({ type: Number, default: null })
  startedAt!: number | null;

  @ApiProperty({ description: 'Timestamp de fin' })
  @Prop({ type: Number, default: null })
  finishedAt!: number | null;
}

export const QuiestceMatchSchema = SchemaFactory.createForClass(QuiestceMatch);
QuiestceMatchSchema.index({ status: 1, variant: 1, createdAt: -1 });
