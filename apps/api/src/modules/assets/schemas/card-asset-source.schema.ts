import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CardAssetSourceDocument = CardAssetSource & Document;

@Schema({ timestamps: true, collection: 'card_asset_sources' })
export class CardAssetSource {
  _id!: Types.ObjectId;

  @ApiProperty({ description: 'Human-readable source name', example: 'kenney-cards' })
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @ApiProperty({ description: 'Base URL for the asset source' })
  @Prop({ required: true })
  url!: string;

  @ApiProperty({ description: 'Download priority (lower = higher priority)', example: 1 })
  @Prop({ required: true, default: 10, min: 1, max: 100 })
  priority!: number;

  @ApiProperty({ description: 'Whether this source is currently active' })
  @Prop({ default: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Last time this source was health-checked' })
  @Prop({ type: Date, default: null })
  lastChecked!: Date | null;

  @ApiProperty({ description: 'Success rate from 0 to 1', example: 0.95 })
  @Prop({ default: 1, min: 0, max: 1 })
  successRate!: number;

  @ApiProperty({ description: 'Total number of assets downloaded from this source' })
  @Prop({ default: 0, min: 0 })
  totalDownloads!: number;

  @ApiProperty({ description: 'Last error message, if any', nullable: true })
  @Prop({ type: String, default: null })
  lastError!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const CardAssetSourceSchema = SchemaFactory.createForClass(CardAssetSource);

CardAssetSourceSchema.index({ priority: 1 });
CardAssetSourceSchema.index({ isActive: 1, priority: 1 });
