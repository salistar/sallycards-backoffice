/**
 * @file notifications.service.ts
 * @description Persistance d'inbox de notifications + envoi push (placeholder).
 */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(userId: string, type: NotificationType, title: string, body: string,
               payload: Record<string, any> = {}) {
    const doc = await this.model.create({
      userId, type, title, body, payload, sentAt: new Date(),
    });
    // TODO: push FCM/APNS, persister pushMessageId
    return doc;
  }

  async listFor(userId: string, limit = 50) {
    return this.model.find({ userId }).sort({ sentAt: -1 }).limit(limit).lean();
  }

  async unreadCount(userId: string) {
    return this.model.countDocuments({ userId, readAt: { $exists: false } });
  }

  async markRead(notifId: string, userId: string) {
    const n = await this.model.findById(notifId);
    if (!n) throw new NotFoundException();
    if (n.userId !== userId) throw new ForbiddenException();
    if (!n.readAt) {
      n.readAt = new Date();
      await n.save();
    }
    return n;
  }

  async markAllRead(userId: string) {
    const r = await this.model.updateMany(
      { userId, readAt: { $exists: false } },
      { $set: { readAt: new Date() } },
    );
    return { read: r.modifiedCount };
  }
}
