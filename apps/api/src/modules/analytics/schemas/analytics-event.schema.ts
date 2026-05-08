import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnalyticsEventDocument = AnalyticsEvent & Document;

/**
 * Événement analytics (équivalent léger à Mixpanel/PostHog).
 * Stocke `event` + `props` JSON, indexable par event/userId/timestamp.
 */
@Schema({ timestamps: true, collection: 'analytics_events' })
export class AnalyticsEvent {
  @Prop({ required: true, index: true })
  event!: string; // ex: 'match_created', 'ai_used', 'daily_played'

  @Prop({ index: true })
  userId?: string;

  @Prop({ type: Object, default: {} })
  props!: Record<string, any>;

  @Prop({ index: true })
  variant?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  timestamp!: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);
AnalyticsEventSchema.index({ event: 1, timestamp: -1 });
