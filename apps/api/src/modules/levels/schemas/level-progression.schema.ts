/**
 * @file level-progression.schema.ts
 * @description Progression XP par utilisateur par jeu. Courbe : XP_n = 100 * n^1.5.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type LevelProgressionDocument = LevelProgression & Document;

@Schema({ timestamps: true, collection: 'levels' })
export class LevelProgression {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
  gameType!: string;

  @ApiProperty()
  @Prop({ default: 1, min: 1, max: 100 })
  level!: number;

  @ApiProperty()
  @Prop({ default: 0 })
  xp!: number;

  @ApiProperty({ description: 'XP requis pour le niveau suivant' })
  @Prop({ default: 100 })
  nextLevelXp!: number;

  @ApiProperty({ description: 'Features debloquees (avatar_1, theme_neon, bot_hard, ...)' })
  @Prop({ type: [String], default: [] })
  unlockedFeatures!: string[];

  @ApiProperty()
  @Prop({ type: Date })
  lastXpGainAt?: Date;
}

export const LevelProgressionSchema = SchemaFactory.createForClass(LevelProgression);
LevelProgressionSchema.index({ userId: 1, gameType: 1 }, { unique: true });

/** Courbe XP : niveau N requiert 100 * N^1.5 XP. */
export function xpForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}
