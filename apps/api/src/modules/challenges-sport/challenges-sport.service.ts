/**
 * @file challenges-sport.service.ts
 * @description Business logic des defis sport.
 */
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChallengeSport, ChallengeSportDocument } from './schemas/challenge-sport.schema';

interface CreateDto {
  receiverId: string;
  gameType: string;
  type: 'walk' | 'run';
  distanceMeters: number;
  deadlineAt: string;
  pointA: { lat: number; lng: number; label?: string };
  pointB: { lat: number; lng: number; label?: string };
}

@Injectable()
export class ChallengesSportService {
  constructor(
    @InjectModel(ChallengeSport.name)
    private readonly model: Model<ChallengeSportDocument>,
  ) {}

  async create(giverId: string, dto: CreateDto) {
    if (dto.distanceMeters < 100 || dto.distanceMeters > 10000)
      throw new BadRequestException('distance entre 100m et 10km');
    const deadline = new Date(dto.deadlineAt);
    if (deadline.getTime() <= Date.now())
      throw new BadRequestException('deadline doit etre future');

    const doc = await this.model.create({
      userIdGiver: giverId,
      userIdReceiver: dto.receiverId,
      gameType: dto.gameType,
      type: dto.type,
      distanceMeters: dto.distanceMeters,
      pointA: { lat: dto.pointA.lat, lng: dto.pointA.lng, label: dto.pointA.label ?? '' },
      pointB: { lat: dto.pointB.lat, lng: dto.pointB.lng, label: dto.pointB.label ?? '' },
      deadlineAt: deadline,
      status: 'pending',
      gpsTrack: [],
      rewardPoints: Math.floor(dto.distanceMeters / 20), // 50 pts pour 1km
      sharedOn: [],
    });

    // TODO: notifications.create('challenge_received', userIdReceiver, ...)
    return doc;
  }

  async track(challengeId: string, userId: string, points: any[]) {
    const c = await this.model.findById(challengeId);
    if (!c) throw new NotFoundException();
    if (c.userIdReceiver !== userId) throw new ForbiddenException();
    if (c.status !== 'pending' && c.status !== 'in-progress')
      throw new BadRequestException('challenge deja termine');

    if (c.status === 'pending') {
      c.status = 'in-progress';
      c.startedAt = new Date();
    }
    c.gpsTrack.push(...points);
    await c.save();
    return { tracked: points.length, total: c.gpsTrack.length };
  }

  async finish(challengeId: string, userId: string, success: boolean, durationMs?: number) {
    const c = await this.model.findById(challengeId);
    if (!c) throw new NotFoundException();
    if (c.userIdReceiver !== userId) throw new ForbiddenException();

    c.status = success ? 'done' : 'failed';
    c.completedAt = new Date();
    c.elapsedTimeMs = durationMs ?? (c.startedAt ? Date.now() - c.startedAt.getTime() : 0);
    await c.save();
    // TODO: notifications.create('challenge_completed', c.userIdGiver, ...)
    return c;
  }

  async history(userId: string): Promise<any[]> {
    const docs = await this.model.find({
      $or: [{ userIdGiver: userId }, { userIdReceiver: userId }],
    }).sort({ createdAt: -1 }).limit(50).lean();
    return docs.map((d: any) => ({
      ...d,
      role: d.userIdGiver === userId ? 'given' : 'received',
    }));
  }

  async listActive(userId: string): Promise<any[]> {
    return this.model.find({
      userIdReceiver: userId,
      status: { $in: ['pending', 'in-progress'] },
    }).lean();
  }

  /** Cron: expire les challenges dont la deadline est passee. */
  async expireOverdue() {
    const r = await this.model.updateMany(
      { status: { $in: ['pending', 'in-progress'] }, deadlineAt: { $lt: new Date() } },
      { $set: { status: 'expired' } },
    );
    return { expired: r.modifiedCount };
  }
}
