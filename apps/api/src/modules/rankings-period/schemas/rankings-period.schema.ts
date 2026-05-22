/**
 * @file rankings-period.schema.ts
 * @description Classement par periode (daily / weekly / monthly / weekend / season).
 * Snapshot fige a la fin de chaque periode par le cron.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RankingsPeriodDocument = RankingsPeriod & Document;
export type Period = 'daily' | 'weekly' | 'monthly' | 'weekend' | 'season';

@Schema({ timestamps: true, collection: 'rankings-period' })
export class RankingsPeriod {
  @ApiProperty()
  @Prop({ required: true, index: true })
  gameType!: string;

  @ApiProperty({ enum: ['daily', 'weekly', 'monthly', 'weekend', 'season'] })
  @Prop({ required: true, enum: ['daily', 'weekly', 'monthly', 'weekend', 'season'], index: true })
  period!: Period;

  @ApiProperty({ description: 'Cle de la periode (YYYY-MM-DD, YYYY-Www, YYYY-MM, ...)' })
  @Prop({ required: true, index: true })
  periodKey!: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true })
  username!: string;

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
  @Prop({ default: 0, index: true })
  rank!: number;

  @ApiProperty()
  @Prop({ type: Date, index: true })
  snapshotAt?: Date;
}

export const RankingsPeriodSchema = SchemaFactory.createForClass(RankingsPeriod);
RankingsPeriodSchema.index({ gameType: 1, period: 1, periodKey: 1, rank: 1 });
RankingsPeriodSchema.index({ gameType: 1, period: 1, periodKey: 1, userId: 1 }, { unique: true });
