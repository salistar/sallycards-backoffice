import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(@InjectConnection() private readonly conn: Connection) {}

  async listPackages() {
    const packages = await this.conn
      .collection('shop_packages')
      .find({ active: true })
      .sort({ sortOrder: 1 })
      .toArray();
    return packages;
  }

  /**
   * Credit a user's coins — called by the RevenueCat webhook OR by the client
   * optimistic path after a successful purchase. All mutations are logged in
   * the `coin_transactions` collection for audit.
   */
  async creditCoins(
    gameType: string,
    userId: string,
    amount: number,
    source: string,
    meta?: Record<string, any>,
  ) {
    const collection = `${gameType}_users`;
    const { ObjectId } = require('mongodb');
    const objectId = (() => { try { return new ObjectId(userId); } catch { return userId; } })();

    await this.conn.collection(collection).updateOne(
      { _id: objectId },
      { $inc: { coins: amount }, $set: { updatedAt: new Date() } },
    );
    await this.conn.collection('coin_transactions').insertOne({
      userId: objectId,
      gameType,
      amount,
      type: amount > 0 ? 'credit' : 'debit',
      source,
      meta: meta ?? {},
      createdAt: new Date(),
    });

    const user = await this.conn.collection(collection).findOne({ _id: objectId }, { projection: { coins: 1 } });
    this.logger.log(`${source}: ${amount > 0 ? '+' : ''}${amount} coins → ${userId} (new balance: ${user?.coins})`);
    return { newBalance: user?.coins ?? 0, amount };
  }

  async findPackage(productId: string) {
    const pkg = await this.conn.collection('shop_packages').findOne({ productId });
    if (!pkg) throw new NotFoundException(`Package ${productId} not found`);
    return pkg;
  }

  /**
   * Client-confirmed purchase (RevenueCat client SDK returned success).
   * Idempotent via purchaseId — same purchase can't be credited twice.
   */
  async confirmPurchase(
    gameType: string,
    userId: string,
    productId: string,
    purchaseId: string,
    platform: 'android' | 'ios',
  ) {
    // Idempotency
    const existing = await this.conn.collection('coin_transactions').findOne({
      'meta.purchaseId': purchaseId,
    });
    if (existing) {
      this.logger.warn(`Purchase ${purchaseId} already credited — skipping`);
      return { already: true, amount: existing.amount };
    }
    const pkg = await this.findPackage(productId);
    const total = (pkg.coins || 0) + (pkg.bonus || 0);
    const { newBalance } = await this.creditCoins(gameType, userId, total, 'purchase', {
      productId,
      purchaseId,
      platform,
      priceEur: pkg.priceEur,
    });
    return { amount: total, newBalance, pkg };
  }

  /**
   * Webhook handler for RevenueCat server-to-server notifications. Events
   * like INITIAL_PURCHASE / RENEWAL / NON_RENEWING_PURCHASE trigger a credit.
   */
  async handleRevenueCatWebhook(body: any) {
    const event = body?.event;
    if (!event) return { ok: false, reason: 'no event' };

    const type = event.type;
    const credited = ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL'];
    if (!credited.includes(type)) {
      this.logger.log(`RevenueCat event ignored: ${type}`);
      return { ok: true, ignored: true };
    }

    const userId = event.app_user_id;
    const productId = event.product_id;
    const purchaseId = event.transaction_id || event.original_transaction_id;
    const gameType = event.subscriber_attributes?.gameType?.value || 'kdoub';

    return this.confirmPurchase(gameType, userId, productId, purchaseId, event.store === 'APP_STORE' ? 'ios' : 'android');
  }
}
