import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type BotProfileDocument = BotProfile & Document;

export enum BotPersonality {
  CAUTIOUS = 'cautious',
  AGGRESSIVE = 'aggressive',
  BALANCED = 'balanced',
  TRICKSTER = 'trickster',
  BEGINNER = 'beginner',
}

export enum BotDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

@Schema({ timestamps: true, collection: 'bot_profiles' })
export class BotProfile {
  @ApiProperty()
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @ApiProperty()
  @Prop({ default: '' })
  avatar!: string;

  @ApiProperty({ enum: BotPersonality })
  @Prop({ required: true, enum: BotPersonality, default: BotPersonality.BALANCED })
  personality!: string;

  @ApiProperty({ enum: BotDifficulty })
  @Prop({ required: true, enum: BotDifficulty, default: BotDifficulty.MEDIUM })
  difficulty!: string;

  @ApiProperty()
  @Prop({ type: [String], default: [] })
  gameTypes!: string[];

  @ApiProperty()
  @Prop(
    raw({
      thinkTimeMin: { type: Number, default: 500 },
      thinkTimeMax: { type: Number, default: 3000 },
      bluffRate: { type: Number, default: 0.2, min: 0, max: 1 },
      memoryAccuracy: { type: Number, default: 0.7, min: 0, max: 1 },
      aggression: { type: Number, default: 0.5, min: 0, max: 1 },
    }),
  )
  config!: {
    thinkTimeMin: number;
    thinkTimeMax: number;
    bluffRate: number;
    memoryAccuracy: number;
    aggression: number;
  };

  @ApiProperty()
  @Prop(
    raw({
      gamesPlayed: { type: Number, default: 0 },
      gamesWon: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
    }),
  )
  stats!: {
    gamesPlayed: number;
    gamesWon: number;
    avgScore: number;
  };

  @ApiProperty()
  @Prop({ type: Map, of: [String], default: {} })
  dialogues!: Map<string, string[]>;

  @ApiProperty()
  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const BotProfileSchema = SchemaFactory.createForClass(BotProfile);

BotProfileSchema.index({ name: 1 }, { unique: true });
BotProfileSchema.index({ difficulty: 1, isActive: 1 });
BotProfileSchema.index({ gameTypes: 1 });
