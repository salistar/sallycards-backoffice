/**
 * @file rewards-voucher.schema.ts
 * @description Bons d'achat 100 EUR (et autres recompenses materielles)
 * envoyes au #1 global multi-classements.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RewardsVoucherDocument = RewardsVoucher & Document;

@Schema({ timestamps: true, collection: 'rewards-vouchers' })
export class RewardsVoucher {
  @ApiProperty({ description: 'Code unique 12 chars alphanumeriques' })
  @Prop({ required: true, unique: true, uppercase: true })
  code!: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true })
  amount!: number;

  @ApiProperty({ enum: ['EUR', 'USD', 'MAD'] })
  @Prop({ required: true, enum: ['EUR', 'USD', 'MAD'], default: 'EUR' })
  currency!: string;

  @ApiProperty({ enum: ['amazon', 'fnac', 'decathlon', 'apple', 'google_play', 'custom'] })
  @Prop({ required: true, enum: ['amazon', 'fnac', 'decathlon', 'apple', 'google_play', 'custom'] })
  providerStoreCode!: string;

  @ApiProperty({ description: 'Raison (ex: top1-all-rankings-may-2026)' })
  @Prop({ required: true })
  reason!: string;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  issuedAt!: Date;

  @ApiProperty()
  @Prop({ type: Date })
  claimedAt?: Date;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @ApiProperty({ enum: ['issued', 'claimed', 'expired'] })
  @Prop({ required: true, enum: ['issued', 'claimed', 'expired'], default: 'issued', index: true })
  status!: string;
}

export const RewardsVoucherSchema = SchemaFactory.createForClass(RewardsVoucher);
RewardsVoucherSchema.index({ userId: 1, status: 1 });
