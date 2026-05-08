import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  _id!: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @ApiProperty()
  @Prop({ required: true, trim: true, minlength: 3, maxlength: 24 })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @ApiProperty()
  @Prop({ default: '' })
  avatar!: string;

  @ApiProperty()
  @Prop({ default: 'en' })
  locale!: string;

  @ApiProperty()
  @Prop(
    raw({
      gamesPlayed: { type: Number, default: 0 },
      gamesWon: { type: Number, default: 0 },
      elo: { type: Number, default: 1000 },
      winStreak: { type: Number, default: 0 },
      bestWinStreak: { type: Number, default: 0 },
      totalPlayTimeMs: { type: Number, default: 0 },
      solitaire: {
        type: {
          gamesPlayed: { type: Number, default: 0 },
          gamesWon: { type: Number, default: 0 },
          elo: { type: Number, default: 1000 },
          winStreak: { type: Number, default: 0 },
          bestWinStreak: { type: Number, default: 0 },
          totalPlayTimeMs: { type: Number, default: 0 },
          bestScore: { type: Number, default: 0 },
        },
        default: () => ({}),
      },
      quiestce: {
        type: {
          gamesPlayed: { type: Number, default: 0 },
          gamesWon: { type: Number, default: 0 },
          elo: { type: Number, default: 1000 },
          winStreak: { type: Number, default: 0 },
          bestWinStreak: { type: Number, default: 0 },
          totalPlayTimeMs: { type: Number, default: 0 },
          questionsAsked: { type: Number, default: 0 },
          fewestQuestionsToWin: { type: Number, default: 0 },
        },
        default: () => ({}),
      },
      concentration: {
        type: {
          gamesPlayed: { type: Number, default: 0 },
          gamesWon: { type: Number, default: 0 },
          elo: { type: Number, default: 1000 },
          winStreak: { type: Number, default: 0 },
          bestWinStreak: { type: Number, default: 0 },
          totalPlayTimeMs: { type: Number, default: 0 },
          pairsFound: { type: Number, default: 0 },
          bestTimeMs: { type: Number, default: 0 },
          bestMoves: { type: Number, default: 0 },
        },
        default: () => ({}),
      },
      scopa: {
        type: {
          gamesPlayed: { type: Number, default: 0 },
          gamesWon: { type: Number, default: 0 },
          elo: { type: Number, default: 1000 },
          winStreak: { type: Number, default: 0 },
          bestWinStreak: { type: Number, default: 0 },
          totalPlayTimeMs: { type: Number, default: 0 },
          totalScopas: { type: Number, default: 0 },        // total Scopa! réalisés
          settebelloCount: { type: Number, default: 0 },    // 7 d'Or capturés
          primieraWins: { type: Number, default: 0 },       // primiera gagnées
        },
        default: () => ({}),
      },
      tarot: {
        type: {
          gamesPlayed: { type: Number, default: 0 },
          gamesWon: { type: Number, default: 0 },
          elo: { type: Number, default: 1000 },
          winStreak: { type: Number, default: 0 },
          bestWinStreak: { type: Number, default: 0 },
          totalPlayTimeMs: { type: Number, default: 0 },
          contractsTaken: { type: Number, default: 0 },     // nb de fois preneur
          chelemsAnnounced: { type: Number, default: 0 },
          chelemsSucceeded: { type: Number, default: 0 },
          petitsAuBout: { type: Number, default: 0 },
        },
        default: () => ({}),
      },
      poker: {
        type: {
          gamesPlayed: { type: Number, default: 0 },
          gamesWon: { type: Number, default: 0 },
          elo: { type: Number, default: 1000 },
          winStreak: { type: Number, default: 0 },
          bestWinStreak: { type: Number, default: 0 },
          totalPlayTimeMs: { type: Number, default: 0 },
          virtualChips: { type: Number, default: 10000 },   // bankroll jetons virtuels
          biggestPotWon: { type: Number, default: 0 },
          handsPlayed: { type: Number, default: 0 },
          handsWon: { type: Number, default: 0 },
          royalFlushes: { type: Number, default: 0 },
        },
        default: () => ({}),
      },
    }),
  )
  stats!: Record<string, any>;

  @ApiProperty()
  @Prop(
    raw({
      theme: { type: String, default: 'system' },
      soundEnabled: { type: Boolean, default: true },
      hapticEnabled: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
      notificationsEnabled: { type: Boolean, default: true },
      autoMatchmaking: { type: Boolean, default: false },
      cardBackStyle: { type: String, default: 'classic' },
    }),
  )
  settings!: Record<string, any>;

  @ApiProperty()
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friends!: Types.ObjectId[];

  @ApiProperty()
  @Prop({
    type: [
      raw({
        odId: { type: Types.ObjectId, ref: 'User' },
        username: { type: String },
        sentAt: { type: Date, default: Date.now },
      }),
    ],
    default: [],
  })
  friendRequests!: Record<string, any>[];

  @ApiProperty()
  @Prop({ type: [String], default: [] })
  blockedUsers!: string[];

  @ApiProperty()
  @Prop({ default: 'player', enum: ['player', 'admin', 'moderator'] })
  role!: string;

  @ApiProperty()
  @Prop({ default: 'ronda', enum: ['ronda', 'kdoub', 'belote', 'poker', 'tarot', 'scopa', 'okey', 'concentration', 'solitaire', 'quiestce'] })
  gameType!: string;

  @ApiProperty()
  @Prop({ default: false })
  isGuest!: boolean;

  @ApiProperty()
  @Prop({ default: 'offline', enum: ['online', 'offline', 'in_game', 'idle'] })
  status!: string;

  @ApiProperty()
  @Prop({ type: Date, default: null })
  lastSeenAt!: Date | null;

  @ApiProperty()
  @Prop({ type: [String], default: [] })
  deviceTokens!: string[];

  @ApiProperty()
  @Prop({ default: false })
  isVerified!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 });
UserSchema.index({ gameType: 1 });
UserSchema.index({ 'stats.elo': -1 });
UserSchema.index({ 'stats.solitaire.elo': -1 });
UserSchema.index({ 'stats.quiestce.elo': -1 });
UserSchema.index({ 'stats.concentration.elo': -1 });
UserSchema.index({ 'stats.scopa.elo': -1 });
UserSchema.index({ 'stats.tarot.elo': -1 });
UserSchema.index({ 'stats.poker.elo': -1 });
UserSchema.index({ status: 1 });
UserSchema.index({ lastSeenAt: -1 });
