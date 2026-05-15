import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export const GAME_TYPES = [
  'ronda',
  'kdoub',
  'belote',
  'poker',
  'tarot',
  'scopa',
  'okey',
  'concentration',
  'solitaire',
  'quiestce',
  'kantcopy',
] as const;

export type GameType = (typeof GAME_TYPES)[number];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly modelMap: Record<string, Model<UserDocument>>;

  constructor(
    @InjectModel('RondaUser')
    private readonly rondaModel: Model<UserDocument>,
    @InjectModel('KdoubUser')
    private readonly kdoubModel: Model<UserDocument>,
    @InjectModel('BeloteUser')
    private readonly beloteModel: Model<UserDocument>,
    @InjectModel('PokerUser')
    private readonly pokerModel: Model<UserDocument>,
    @InjectModel('TarotUser')
    private readonly tarotModel: Model<UserDocument>,
    @InjectModel('ScopaUser')
    private readonly scopaModel: Model<UserDocument>,
    @InjectModel('OkeyUser')
    private readonly okeyModel: Model<UserDocument>,
    @InjectModel('ConcentrationUser')
    private readonly concentrationModel: Model<UserDocument>,
    @InjectModel('SolitaireUser')
    private readonly solitaireModel: Model<UserDocument>,
    @InjectModel('QuiestceUser')
    private readonly quiestceModel: Model<UserDocument>,
    @InjectModel('KantcopyUser')
    private readonly kantcopyModel: Model<UserDocument>,
  ) {
    this.modelMap = {
      ronda: this.rondaModel,
      kdoub: this.kdoubModel,
      belote: this.beloteModel,
      poker: this.pokerModel,
      tarot: this.tarotModel,
      scopa: this.scopaModel,
      okey: this.okeyModel,
      concentration: this.concentrationModel,
      solitaire: this.solitaireModel,
      quiestce: this.quiestceModel,
      kantcopy: this.kantcopyModel,
    };
  }

  /**
   * Get the Mongoose model for a specific game type.
   * Falls back to ronda if the game type is unknown.
   */
  getModel(gameType: string): Model<UserDocument> {
    return this.modelMap[gameType] || this.rondaModel;
  }

  /**
   * Return all models with their game type labels.
   */
  getAllModels(): { gameType: string; model: Model<UserDocument> }[] {
    return Object.entries(this.modelMap).map(([gameType, model]) => ({
      gameType,
      model,
    }));
  }

  /**
   * Find a user by ID. If gameType is specified, search only that collection.
   * Otherwise search all collections sequentially until found.
   */
  async findById(
    id: string,
    gameType?: string,
  ): Promise<UserDocument | null> {
    if (gameType) {
      return this.getModel(gameType).findById(id).exec();
    }

    for (const { model } of this.getAllModels()) {
      const user = await model.findById(id).exec();
      if (user) return user;
    }
    return null;
  }

  /**
   * Find a user by email. If gameType is specified, search only that collection.
   * Otherwise search all collections sequentially until found.
   */
  async findByEmail(
    email: string,
    gameType?: string,
  ): Promise<UserDocument | null> {
    const normalizedEmail = email.toLowerCase();

    if (gameType) {
      return this.getModel(gameType)
        .findOne({ email: normalizedEmail })
        .exec();
    }

    for (const { model } of this.getAllModels()) {
      const user = await model.findOne({ email: normalizedEmail }).exec();
      if (user) return user;
    }
    return null;
  }

  /**
   * Find users by game type from the corresponding collection.
   */
  async findByGameType(gameType: string): Promise<UserDocument[]> {
    return this.getModel(gameType)
      .find()
      .select('-passwordHash')
      .sort({ 'stats.elo': -1 })
      .limit(50)
      .exec();
  }

  /**
   * Find all users across all collections and merge results.
   */
  async findAll(): Promise<{ gameType: string; users: UserDocument[] }[]> {
    const results: { gameType: string; users: UserDocument[] }[] = [];

    for (const { gameType, model } of this.getAllModels()) {
      const users = await model
        .find()
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .exec();
      results.push({ gameType, users });
    }

    return results;
  }

  /**
   * Create a user in a specific game collection (defaults to ronda).
   */
  async create(
    data: {
      email: string;
      username: string;
      passwordHash: string;
      isGuest?: boolean;
      role?: string;
    },
    gameType?: string,
  ): Promise<UserDocument> {
    const model = this.getModel(gameType || 'ronda');
    const user = new model({
      email: data.email.toLowerCase(),
      username: data.username,
      passwordHash: data.passwordHash,
      isGuest: data.isGuest ?? false,
      role: data.role || 'player',
      stats: { gamesPlayed: 0, gamesWon: 0, elo: 1000 },
      settings: {
        theme: 'system',
        soundEnabled: true,
        hapticEnabled: true,
        language: 'en',
      },
    });
    this.logger.log(
      `Creating user: ${data.email} in ${gameType || 'ronda'}_users`,
    );
    return user.save();
  }

  /**
   * Update a user. If gameType is specified, search only that collection.
   * Otherwise search all collections to find the user.
   */
  async update(
    id: string,
    data: Partial<Pick<User, 'username' | 'avatar' | 'locale' | 'settings'>>,
    gameType?: string,
  ): Promise<UserDocument> {
    if (gameType) {
      const user = await this.getModel(gameType)
        .findByIdAndUpdate(id, { $set: data }, { new: true })
        .exec();
      if (!user) throw new NotFoundException('User not found');
      return user;
    }

    for (const { model } of this.getAllModels()) {
      const user = await model
        .findByIdAndUpdate(id, { $set: data }, { new: true })
        .exec();
      if (user) return user;
    }
    throw new NotFoundException('User not found');
  }

  /**
   * Delete a user. If gameType is specified, search only that collection.
   * Otherwise search all collections to find the user.
   */
  async delete(id: string, gameType?: string): Promise<void> {
    if (gameType) {
      const result = await this.getModel(gameType)
        .findByIdAndDelete(id)
        .exec();
      if (!result) throw new NotFoundException('User not found');
      this.logger.log(`Deleted user: ${id} from ${gameType}_users`);
      return;
    }

    for (const { model, gameType: gt } of this.getAllModels()) {
      const result = await model.findByIdAndDelete(id).exec();
      if (result) {
        this.logger.log(`Deleted user: ${id} from ${gt}_users`);
        return;
      }
    }
    throw new NotFoundException('User not found');
  }
}
