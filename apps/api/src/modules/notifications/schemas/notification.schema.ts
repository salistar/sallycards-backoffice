/**
 * @file notification.schema.ts
 * @description Inbox de notifications persistees (push delivere ou non).
 * Complete les notification-templates.ts existants.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type NotificationDocument = Notification & Document;

export type NotificationType =
  | 'your_turn' | 'game_invite' | 'friend_request'
  | 'tournament_start' | 'tournament_end'
  | 'daily_challenge' | 'achievement_unlocked' | 'game_abandoned'
  | 'challenge_received' | 'challenge_completed' | 'challenge_failed'
  | 'reward_issued' | 'level_up';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @ApiProperty()
  @Prop({ required: true, index: true })
  userId!: string;

  @ApiProperty()
  @Prop({ required: true, index: true })
  type!: NotificationType;

  @ApiProperty()
  @Prop({ required: true })
  title!: string;

  @ApiProperty()
  @Prop({ required: true })
  body!: string;

  @ApiProperty({ description: 'Payload libre (challengeId, tournamentId, ...)' })
  @Prop({ type: Object, default: {} })
  payload!: Record<string, any>;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  sentAt!: Date;

  @ApiProperty()
  @Prop({ type: Date })
  readAt?: Date;

  @ApiProperty()
  @Prop({ type: Date })
  deliveredAt?: Date;

  @ApiProperty({ description: 'Push notification id (FCM/APNS)' })
  @Prop()
  pushMessageId?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ userId: 1, readAt: 1, sentAt: -1 });
NotificationSchema.index({ userId: 1, type: 1 });
