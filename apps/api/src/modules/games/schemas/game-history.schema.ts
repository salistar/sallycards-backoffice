import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type GameHistoryDocument = GameHistory & Document;

export enum GameType {
  RONDA = 'ronda',
  TRUCO = 'truco',
  BRISCA = 'brisca',
  TUTE = 'tute',
  CINQUILLO = 'cinquillo',
  JULEPE = 'julepe',
}

export enum GameMode {
  ONLINE = 'online',
  BLUETOOTH = 'bluetooth',
  LAN = 'lan',
  OFFLINE = 'offline',
}

@Schema({ timestamps: true, collection: 'game_history' })
export class GameHistory {
  @ApiProperty()
  @Prop({ required: true, unique: true, index: true })
  gameId!: string;

  @ApiProperty({ enum: GameType })
  @Prop({ required: true, enum: GameType })
  gameType!: string;

  @ApiProperty()
  @Prop({
    type: [
      raw({
        userId: { type: String, required: true },
        username: { type: String, required: true },
        score: { type: Number, default: 0 },
        isBot: { type: Boolean, default: false },
        placement: { type: Number, default: 0 },
      }),
    ],
    default: [],
  })
  players!: {
    userId: string;
    username: string;
    score: number;
    isBot: boolean;
    placement: number;
  }[];

  @ApiProperty()
  @Prop({
    type: [
      raw({
        playerId: { type: String, required: true },
        type: { type: String, required: true },
        payload: { type: MongooseSchema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
      }),
    ],
    default: [],
  })
  moves!: {
    playerId: string;
    type: string;
    payload: any;
    timestamp: Date;
  }[];

  @ApiProperty()
  @Prop(
    raw({
      winnerId: { type: String, default: null },
      isDraw: { type: Boolean, default: false },
      finalScores: { type: Map, of: Number, default: {} },
    }),
  )
  result!: {
    winnerId: string | null;
    isDraw: boolean;
    finalScores: Map<string, number>;
  };

  @ApiProperty()
  @Prop({ required: true, default: 0 })
  duration!: number;

  @ApiProperty({ enum: GameMode })
  @Prop({ required: true, enum: GameMode, default: GameMode.ONLINE })
  mode!: string;

  @ApiProperty()
  @Prop({ required: true, type: Date })
  startedAt!: Date;

  @ApiProperty()
  @Prop({ type: Date, default: null })
  endedAt!: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const GameHistorySchema = SchemaFactory.createForClass(GameHistory);

GameHistorySchema.index({ gameType: 1, endedAt: -1 });
GameHistorySchema.index({ 'players.userId': 1, gameType: 1 });
GameHistorySchema.index({ startedAt: -1 });
