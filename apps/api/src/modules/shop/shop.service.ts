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

  /** Catalogue d'items cosmétiques (avatars, thèmes, decks, premium, boosts). */
  async listItems(category?: string) {
    const filter: Record<string, any> = { active: { $ne: false } };
    if (category) filter.category = category;
    return this.conn.collection('shop_items').find(filter).sort({ sortOrder: 1 }).toArray();
  }

  /** Détail d'un item par id. */
  async getItem(id: string) {
    const { ObjectId } = require('mongodb');
    const oid = (() => { try { return new ObjectId(id); } catch { return id; } })();
    const item = await this.conn.collection('shop_items').findOne({ _id: oid });
    if (!item) throw new NotFoundException(`Item ${id} introuvable`);
    return item;
  }

  /** Historique d'achats d'un utilisateur. */
  async listPurchases(userId: string) {
    const { ObjectId } = require('mongodb');
    const oid = (() => { try { return new ObjectId(userId); } catch { return userId; } })();
    return this.conn
      .collection('purchases')
      .find({ userId: oid })
      .sort({ purchasedAt: -1 })
      .toArray();
  }

  /**
   * Enregistre une intention d'achat (status 'pending'). Le paiement réel
   * passe par le store natif ; la validation finale arrive via le webhook
   * RevenueCat. On trace l'intention pour le suivi et l'historique.
   */
  async createPurchaseIntent(userId: string, itemId: string, name: string, priceEur: number) {
    const { ObjectId } = require('mongodb');
    const oid = (() => { try { return new ObjectId(userId); } catch { return userId; } })();
    const doc = {
      userId: oid,
      itemId: itemId ?? null,
      name: name ?? 'Article',
      priceEur: Number(priceEur) || 0,
      status: 'pending' as const,
      purchasedAt: new Date(),
      createdAt: new Date(),
    };
    const res = await this.conn.collection('purchases').insertOne(doc);
    this.logger.log(`🛒 purchase-intent ${name} (${priceEur}€) → ${userId}`);
    return { id: res.insertedId, ...doc };
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

  // ── VIP Pass (abonnement RevenueCat) ───────────────────────────────────
  /** Produits VIP → durée en mois. Mappés aux product IDs RevenueCat. */
  private readonly VIP_PRODUCTS: Record<string, number> = {
    sally_plus_monthly: 1,
    sally_plus_yearly: 12,
  };

  private oid(userId: string) {
    const { ObjectId } = require('mongodb');
    try { return new ObjectId(userId); } catch { return userId; }
  }

  /** Accorde / prolonge le statut VIP (cumulatif si encore actif). */
  async grantVip(gameType: string, userId: string, months: number, meta: Record<string, any> = {}) {
    const collection = `${gameType}_users`;
    const oid = this.oid(userId);
    const user = await this.conn.collection(collection).findOne({ _id: oid }, { projection: { vipUntil: 1 } });
    const now = new Date();
    const base = user?.vipUntil && new Date(user.vipUntil) > now ? new Date(user.vipUntil) : now;
    const vipUntil = new Date(base.getTime() + months * 30 * 24 * 3600 * 1000);
    await this.conn.collection(collection).updateOne(
      { _id: oid },
      { $set: { vipUntil, isVip: true, updatedAt: new Date() } },
    );
    await this.conn.collection('coin_transactions').insertOne({
      userId: oid, gameType, amount: 0, type: 'vip', source: 'vip_purchase',
      meta: { ...meta, months }, createdAt: new Date(),
    });
    this.logger.log(`👑 VIP accordé ${months} mois → ${userId} (jusqu'à ${vipUntil.toISOString()})`);
    return { isVip: true, vipUntil };
  }

  /** Statut VIP courant. */
  async getVipStatus(gameType: string, userId: string) {
    const user = await this.conn.collection(`${gameType}_users`).findOne(
      { _id: this.oid(userId) }, { projection: { vipUntil: 1 } },
    );
    const vipUntil = user?.vipUntil ? new Date(user.vipUntil) : null;
    return { isVip: !!vipUntil && vipUntil > new Date(), vipUntil };
  }

  /** Révoque le VIP (expiration / annulation webhook). */
  async revokeVip(gameType: string, userId: string) {
    await this.conn.collection(`${gameType}_users`).updateOne(
      { _id: this.oid(userId) },
      { $set: { isVip: false, updatedAt: new Date() } },
    );
    this.logger.log(`👑 VIP révoqué → ${userId}`);
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

    // VIP Pass (abonnement) : on accorde du temps VIP, pas des coins.
    const vipMonths = this.VIP_PRODUCTS[productId];
    if (vipMonths) {
      const res = await this.grantVip(gameType, userId, vipMonths, { productId, purchaseId, platform });
      return { vip: true, ...res };
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
    const userId = event.app_user_id;
    const productId = event.product_id;
    const purchaseId = event.transaction_id || event.original_transaction_id;
    const gameType = event.subscriber_attributes?.gameType?.value || 'belote';

    // Fin d'abonnement VIP → révocation
    const revoked = ['CANCELLATION', 'EXPIRATION'];
    if (revoked.includes(type) && this.VIP_PRODUCTS[productId]) {
      await this.revokeVip(gameType, userId);
      return { ok: true, vipRevoked: true };
    }

    const credited = ['INITIAL_PURCHASE', 'NON_RENEWING_PURCHASE', 'RENEWAL'];
    if (!credited.includes(type)) {
      this.logger.log(`RevenueCat event ignored: ${type}`);
      return { ok: true, ignored: true };
    }

    return this.confirmPurchase(gameType, userId, productId, purchaseId, event.store === 'APP_STORE' ? 'ios' : 'android');
  }
}
