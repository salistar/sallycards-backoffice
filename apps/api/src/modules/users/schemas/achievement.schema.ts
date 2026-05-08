import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AchievementDocument = Achievement & Document;

@Schema({ timestamps: true, collection: 'achievements' })
export class Achievement {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty({ description: 'Achievement type, e.g. "first_ronda", "100_games"' })
  @Prop({ required: true })
  type!: string;

  @ApiProperty({ description: 'Optional game type this achievement relates to' })
  @Prop({ type: String, default: null })
  gameType!: string | null;

  @ApiProperty({ description: 'Progress percentage from 0 to 100' })
  @Prop({ default: 0, min: 0, max: 100 })
  progress!: number;

  @ApiProperty({ description: 'Date the achievement was unlocked, null if locked' })
  @Prop({ type: Date, default: null })
  unlockedAt!: Date | null;

  @ApiProperty()
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);

AchievementSchema.index({ userId: 1, type: 1 }, { unique: true });
AchievementSchema.index({ userId: 1, unlockedAt: -1 });
