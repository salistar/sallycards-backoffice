/**
 * @file challenge-sport.schema.ts
 * @description Defi sport (marche/course de A vers B) impose par le gagnant
 * d'un match au perdant. GPS tracking + deadline + partage social.
 */
import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ChallengeSportDocument = ChallengeSport & Document;

export type ChallengeType = 'walk' | 'run';
export type ChallengeStatus = 'pending' | 'in-progress' | 'done' | 'failed' | 'expired';
export type SocialChannel = 'whatsapp' | 'instagram' | 'tiktok' | 'snapchat' | 'sms' | 'other';

@Schema({ timestamps: true, collection: 'challenges-sport' })
export class ChallengeSport {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userIdGiver!: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
  userIdReceiver!: string;

  @ApiProperty()
  @Prop({ required: true })
  gameType!: string;

  @ApiProperty({ enum: ['walk', 'run'] })
  @Prop({ required: true, enum: ['walk', 'run'] })
  type!: ChallengeType;

  @ApiProperty()
  @Prop({ required: true, min: 100, max: 10000 })
  distanceMeters!: number;

  @ApiProperty({ description: 'Point depart {lat,lng,label}' })
  @Prop(raw({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String, default: '' },
  }))
  pointA!: { lat: number; lng: number; label: string };

  @ApiProperty()
  @Prop(raw({
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String, default: '' },
  }))
  pointB!: { lat: number; lng: number; label: string };

  @ApiProperty()
  @Prop({ required: true, type: Date, index: true })
  deadlineAt!: Date;

  @ApiProperty({ enum: ['pending', 'in-progress', 'done', 'failed', 'expired'] })
  @Prop({ required: true, enum: ['pending', 'in-progress', 'done', 'failed', 'expired'], default: 'pending', index: true })
  status!: ChallengeStatus;

  @ApiProperty({ description: 'Temps reel mis pour finir (ms)' })
  @Prop({ default: 0 })
  elapsedTimeMs!: number;

  @ApiProperty({ description: 'Trajectoire GPS, batch toutes les 10 sec' })
  @Prop({ type: [Object], default: [] })
  gpsTrack!: { lat: number; lng: number; ts: number; accuracyM: number }[];

  @ApiProperty()
  @Prop({ default: 0 })
  rewardPoints!: number;

  @ApiProperty()
  @Prop({ type: [String], default: [] })
  sharedOn!: SocialChannel[];

  @ApiProperty()
  @Prop({ type: Date })
  completedAt?: Date;

  @ApiProperty()
  @Prop({ type: Date })
  startedAt?: Date;
}

export const ChallengeSportSchema = SchemaFactory.createForClass(ChallengeSport);
ChallengeSportSchema.index({ status: 1, deadlineAt: 1 }); // cron expiration
ChallengeSportSchema.index({ userIdReceiver: 1, status: 1 });
