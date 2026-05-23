/**
 * @file posts.service.ts
 * @description Logique du mur de partage (posts libres par jeu).
 */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private readonly model: Model<PostDocument>) {}

  async list(gameType: string, limit = 40) {
    return this.model.find({ gameType }).sort({ createdAt: -1 }).limit(Math.min(limit, 100)).lean();
  }

  async create(gameType: string, userId: string, username: string, text: string) {
    const t = (text || '').trim();
    if (!t) throw new BadRequestException('texte requis');
    if (t.length > 280) throw new BadRequestException('280 caractères max');
    return this.model.create({ gameType, userId, username, text: t, likes: [] });
  }

  async toggleLike(id: string, userId: string) {
    const p = await this.model.findById(id);
    if (!p) throw new NotFoundException();
    const i = p.likes.indexOf(userId);
    if (i >= 0) p.likes.splice(i, 1); else p.likes.push(userId);
    await p.save();
    return { likes: p.likes.length, liked: i < 0 };
  }
}
