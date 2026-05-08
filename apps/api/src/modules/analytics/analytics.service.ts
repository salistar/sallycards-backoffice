import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventDocument } from './schemas/analytics-event.schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name) private eventModel: Model<AnalyticsEventDocument>,
  ) {}

  /** Enregistre un événement (fire-and-forget — n'erreur pas si BD down). */
  async track(payload: {
    event: string;
    userId?: string;
    variant?: string;
    props?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.eventModel.create({
        event: payload.event,
        userId: payload.userId,
        variant: payload.variant,
        props: payload.props ?? {},
        timestamp: new Date(),
      });
    } catch (err: any) {
      // Analytics ne doit JAMAIS faire crasher l'app
      this.logger.warn(`track(${payload.event}) failed: ${err?.message ?? err}`);
    }
  }

  /** Compte par event sur les N derniers jours. */
  async countByEvent(days = 7): Promise<Record<string, number>> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const docs = await this.eventModel.aggregate([
      { $match: { timestamp: { $gte: cutoff } } },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).exec();
    const out: Record<string, number> = {};
    for (const d of docs) out[d._id] = d.count;
    return out;
  }

  /** Compte d'utilisateurs uniques par event sur les N derniers jours. */
  async uniqueUsersByEvent(days = 7): Promise<Record<string, number>> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const docs = await this.eventModel.aggregate([
      { $match: { timestamp: { $gte: cutoff }, userId: { $ne: null } } },
      { $group: { _id: { event: '$event', userId: '$userId' } } },
      { $group: { _id: '$_id.event', users: { $sum: 1 } } },
    ]).exec();
    const out: Record<string, number> = {};
    for (const d of docs) out[d._id] = d.users;
    return out;
  }

  /** Funnel : compte les users ayant fait l'event A puis B. */
  async funnel(eventA: string, eventB: string, days = 30): Promise<{
    aOnly: number; both: number; conversionRate: number;
  }> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const a = await this.eventModel.distinct('userId', {
      event: eventA, timestamp: { $gte: cutoff }, userId: { $ne: null },
    });
    const b = await this.eventModel.distinct('userId', {
      event: eventB, timestamp: { $gte: cutoff }, userId: { $in: a },
    });
    return {
      aOnly: a.length - b.length,
      both: b.length,
      conversionRate: a.length === 0 ? 0 : Math.round((b.length / a.length) * 1000) / 10,
    };
  }
}
