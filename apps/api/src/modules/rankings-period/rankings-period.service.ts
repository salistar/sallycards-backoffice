/**
 * @file rankings-period.service.ts
 * @description Service de classements par periode.
 * Strategie : lecture rapide (avec cache Redis 60s ideal), ecriture par cron
 * a la fermeture de chaque periode (snapshotAt).
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RankingsPeriod, RankingsPeriodDocument, Period } from './schemas/rankings-period.schema';

@Injectable()
export class RankingsPeriodService {
  constructor(
    @InjectModel(RankingsPeriod.name)
    private readonly model: Model<RankingsPeriodDocument>,
  ) {}

  /** Calcule la cle de periode pour aujourd'hui (UTC). */
  static periodKey(period: Period, when: Date = new Date()): string {
    const y = when.getUTCFullYear();
    const m = String(when.getUTCMonth() + 1).padStart(2, '0');
    const d = String(when.getUTCDate()).padStart(2, '0');
    if (period === 'daily') return `${y}-${m}-${d}`;
    if (period === 'monthly') return `${y}-${m}`;
    if (period === 'weekly') {
      const wk = RankingsPeriodService.isoWeek(when);
      return `${y}-W${String(wk).padStart(2, '0')}`;
    }
    if (period === 'weekend') {
      const wk = RankingsPeriodService.isoWeek(when);
      return `${y}-W${String(wk).padStart(2, '0')}-WE`;
    }
    // season
    const q = Math.floor(when.getUTCMonth() / 3) + 1;
    return `${y}-Q${q}`;
  }

  private static isoWeek(d: Date): number {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const yStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t.getTime() - yStart.getTime()) / 86400000 + 1) / 7);
  }

  async top(gameType: string, period: Period, limit = 100) {
    const periodKey = RankingsPeriodService.periodKey(period);
    return this.model.find({ gameType, period, periodKey })
      .sort({ rank: 1 }).limit(limit).lean();
  }

  async myRank(userId: string, gameType: string, period: Period) {
    const periodKey = RankingsPeriodService.periodKey(period);
    return this.model.findOne({ userId, gameType, period, periodKey }).lean();
  }

  /** Cron: recalcule un classement (a appeler par CronService toutes les 5 min). */
  async recompute(gameType: string, period: Period) {
    const periodKey = RankingsPeriodService.periodKey(period);
    // Calcul a partir des matches du jeu — placeholder, a brancher sur les
    // collections <game>-matches via aggregation MongoDB.
    return { gameType, period, periodKey, status: 'placeholder — branch onto matches aggregation' };
  }

  /** Detecte les top-1 multi-classement pour distribuer les vouchers 100 EUR. */
  async findTop1MultiClassement(gameType: string): Promise<string[]> {
    const periods: Period[] = ['daily', 'weekly', 'monthly', 'weekend', 'season'];
    const top1ByPeriod = await Promise.all(periods.map(async (p) => {
      const key = RankingsPeriodService.periodKey(p);
      const doc = await this.model.findOne({ gameType, period: p, periodKey: key, rank: 1 }).lean();
      return doc?.userId;
    }));
    // user qui est #1 dans LES 5 classements
    const counts = new Map<string, number>();
    for (const uid of top1ByPeriod) {
      if (uid) counts.set(uid, (counts.get(uid) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, n]) => n === 5).map(([uid]) => uid);
  }
}
