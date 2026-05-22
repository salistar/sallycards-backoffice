import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(@InjectConnection() private readonly conn: Connection) {}

  async createTicket(userId: string | null, subject: string, message: string, email?: string) {
    if (!message || message.trim().length < 10) {
      throw new BadRequestException('Message trop court (10 caractères min)');
    }
    const { ObjectId } = require('mongodb');
    const oid = (() => { try { return userId ? new ObjectId(userId) : null; } catch { return userId; } })();
    const doc = {
      userId: oid,
      email: email ?? null,
      subject: subject ?? 'Autre',
      message: message.trim(),
      status: 'open' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await this.conn.collection('support_tickets').insertOne(doc);
    this.logger.log(`📨 Ticket support [${doc.subject}] de ${userId ?? 'anonyme'}`);
    return { id: res.insertedId, status: doc.status };
  }
}
