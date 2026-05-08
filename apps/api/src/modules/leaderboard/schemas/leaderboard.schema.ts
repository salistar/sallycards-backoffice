import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type LeaderboardEntryDocument = LeaderboardEntry & Document;

@Schema({ timestamps: true, collection: 'leaderboard' })
export class LeaderboardEntry {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true })
  username!: string;

  @ApiProperty()
  @Prop({ required: true })
  gameType!: string;

  @ApiProperty({ description: 'Season identifier, e.g. "2026-Q1"' })
  @Prop({ required: true })
  season!: string;

  @ApiProperty()
  @Prop({ default: 0 })
  score!: number;

  @ApiProperty()
  @Prop({ default: 0 })
  gamesPlayed!: number;

  @ApiProperty()
  @Prop({ default: 0 })
  gamesWon!: number;

  @ApiProperty()
  @Prop({ default: 0, min: 0, max: 100 })
  winRate!: number;

  @ApiProperty()
  @Prop({ default: 1000 })
  elo!: number;

  @ApiProperty()
  @Prop({ default: 0 })
  rank!: number;

  @ApiProperty()
  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;

  createdAt!: Date;
}

export const LeaderboardEntrySchema =
  SchemaFactory.createForClass(LeaderboardEntry);

LeaderboardEntrySchema.index(
  { userId: 1, gameType: 1, season: 1 },
  { unique: true },
);
LeaderboardEntrySchema.index({ gameType: 1, season: 1, elo: -1 });
LeaderboardEntrySchema.index({ gameType: 1, season: 1, rank: 1 });
