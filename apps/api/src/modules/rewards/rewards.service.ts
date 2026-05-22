/**
 * @file rewards.service.ts
 * @description Distribution de bons d'achat 100 EUR pour le #1 multi-classement.
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardsVoucher, RewardsVoucherDocument } from './schemas/rewards-voucher.schema';
import * as crypto from 'crypto';

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(RewardsVoucher.name)
    private readonly model: Model<RewardsVoucherDocument>,
  ) {}

  static generateCode(): string {
    return crypto.randomBytes(6).toString('base64')
      .replace(/[+/=]/g, '').toUpperCase().slice(0, 12)
      .padEnd(12, 'X');
  }

  async issue(userId: string, amount: number, reason: string,
              providerStoreCode: string, currency = 'EUR', validDays = 90) {
    const expiresAt = new Date(Date.now() + validDays * 86400000);
    return this.model.create({
      code: RewardsService.generateCode(),
      userId, amount, currency, providerStoreCode,
      reason, issuedAt: new Date(), expiresAt, status: 'issued',
    });
  }

  async myVouchers(userId: string) {
    return this.model.find({ userId }).sort({ issuedAt: -1 }).lean();
  }

  async claim(code: string, userId: string) {
    const v = await this.model.findOne({ code });
    if (!v) throw new NotFoundException();
    if (v.userId !== userId) throw new ForbiddenException();
    if (v.status !== 'issued') throw new ForbiddenException('deja claimed ou expire');
    v.status = 'claimed';
    v.claimedAt = new Date();
    await v.save();
    return v;
  }

  /** Cron: expire les vouchers passes. */
  async expireOverdue() {
    const r = await this.model.updateMany(
      { status: 'issued', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } },
    );
    return { expired: r.modifiedCount };
  }
}
