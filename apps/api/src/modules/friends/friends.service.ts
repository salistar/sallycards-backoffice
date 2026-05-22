/**
 * @file friends.service.ts
 * @description Relations sociales (demandes/accept/block).
 */
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Friend, FriendDocument, FriendStatus } from './schemas/friend.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(Friend.name) private readonly model: Model<FriendDocument>,
  ) {}

  async sendRequest(requesterId: string, receiverId: string) {
    if (requesterId === receiverId) throw new BadRequestException('cannot friend self');
    const existing = await this.model.findOne({
      $or: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId },
      ],
    });
    if (existing) throw new BadRequestException('relation deja existante (' + existing.status + ')');
    return this.model.create({
      requesterId, receiverId, status: 'pending', requestedAt: new Date(),
    });
  }

  async respond(friendDocId: string, userId: string, status: FriendStatus) {
    const f = await this.model.findById(friendDocId);
    if (!f) throw new NotFoundException();
    if (f.receiverId !== userId) throw new ForbiddenException();
    f.status = status;
    if (status === 'accepted') f.acceptedAt = new Date();
    await f.save();
    return f;
  }

  async myFriends(userId: string) {
    const list = await this.model.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
    }).lean();
    return list.map((f) => ({
      _id: f._id,
      otherUserId: f.requesterId === userId ? f.receiverId : f.requesterId,
      status: f.status,
      direction: f.requesterId === userId ? 'sent' : 'received',
      requestedAt: f.requestedAt,
      acceptedAt: f.acceptedAt,
    }));
  }
}
