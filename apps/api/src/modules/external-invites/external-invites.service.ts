import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { randomBytes } from 'crypto';

const BASE_URL = 'https://salistar.com/c';

@Injectable()
export class ExternalInvitesService {
  private readonly logger = new Logger(ExternalInvitesService.name);

  constructor(@InjectConnection() private readonly conn: Connection) {}

  /** Crée un lien d'invitation magique (deep-link) partageable. */
  async create(userId: string, game: string, channel?: string) {
    const token = randomBytes(8).toString('hex');
    const { ObjectId } = require('mongodb');
    const oid = (() => { try { return new ObjectId(userId); } catch { return userId; } })();
    const doc = {
      token,
      fromUserId: oid,
      game: game ?? 'belote',
      channel: channel ?? null,
      status: 'pending' as const,
      claimedByUserId: null,
      createdAt: new Date(),
    };
    await this.conn.collection('external_invites').insertOne(doc);
    const url = `${BASE_URL}/${token}?game=${doc.game}&from=${userId}`;
    this.logger.log(`🔗 Invite externe créée : ${url} (channel=${doc.channel ?? '-'})`);
    return { token, url };
  }

  /** Réclame une invitation (appelé quand l'inconnu installe + se connecte). */
  async claim(token: string, userId: string) {
    const { ObjectId } = require('mongodb');
    const oid = (() => { try { return new ObjectId(userId); } catch { return userId; } })();
    const res = await this.conn.collection('external_invites').findOneAndUpdate(
      { token, status: 'pending' },
      { $set: { status: 'claimed', claimedByUserId: oid, claimedAt: new Date() } },
      { returnDocument: 'after' },
    );
    return res?.value ?? null;
  }
}
