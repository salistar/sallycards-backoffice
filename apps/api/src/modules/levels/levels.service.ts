/**
 * @file levels.service.ts
 * @description Progression XP. Courbe : XP_n = round(100 * n^1.5).
 */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LevelProgression, LevelProgressionDocument, xpForLevel } from './schemas/level-progression.schema';

const UNLOCKABLES: { atLevel: number; feature: string }[] = [
  { atLevel: 2, feature: 'avatar_bronze' },
  { atLevel: 5, feature: 'theme_neon' },
  { atLevel: 10, feature: 'bot_hard' },
  { atLevel: 15, feature: 'avatar_silver' },
  { atLevel: 20, feature: 'theme_marbre' },
  { atLevel: 25, feature: 'deck_custom_es' },
  { atLevel: 30, feature: 'tournament_access' },
  { atLevel: 50, feature: 'avatar_gold' },
  { atLevel: 75, feature: 'theme_legend' },
  { atLevel: 100, feature: 'avatar_legend' },
];

@Injectable()
export class LevelsService {
  constructor(
    @InjectModel(LevelProgression.name)
    private readonly model: Model<LevelProgressionDocument>,
  ) {}

  async getOrCreate(userId: string, gameType: string) {
    let doc = await this.model.findOne({ userId, gameType });
    if (!doc) {
      doc = await this.model.create({
        userId, gameType, level: 1, xp: 0, nextLevelXp: xpForLevel(2),
        unlockedFeatures: [],
      });
    }
    return doc;
  }

  /** Ajoute XP, fait passer de niveau si necessaire, debloque features. */
  async addXp(userId: string, gameType: string, amount: number):
      Promise<{ leveledUp: boolean; level: number; xp: number; unlocked: string[] }> {
    const doc = await this.getOrCreate(userId, gameType);
    doc.xp += amount;
    doc.lastXpGainAt = new Date();

    const newlyUnlocked: string[] = [];
    while (doc.xp >= doc.nextLevelXp && doc.level < 100) {
      doc.xp -= doc.nextLevelXp;
      doc.level += 1;
      doc.nextLevelXp = xpForLevel(doc.level + 1);
      // Deblocage
      for (const u of UNLOCKABLES) {
        if (u.atLevel === doc.level && !doc.unlockedFeatures.includes(u.feature)) {
          doc.unlockedFeatures.push(u.feature);
          newlyUnlocked.push(u.feature);
        }
      }
    }
    await doc.save();
    return { leveledUp: newlyUnlocked.length > 0, level: doc.level, xp: doc.xp, unlocked: newlyUnlocked };
  }
}
