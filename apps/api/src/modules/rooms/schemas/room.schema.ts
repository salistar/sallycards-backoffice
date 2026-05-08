import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true, collection: 'rooms' })
export class Room {
  _id!: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code!: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  hostId!: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  gameType!: string;

  @ApiProperty()
  @Prop({
    type: [
      raw({
        userId: { type: Types.ObjectId, ref: 'User' },
        username: { type: String },
        avatar: { type: String, default: '' },
        elo: { type: Number, default: 1000 },
        isReady: { type: Boolean, default: false },
        isHost: { type: Boolean, default: false },
        isSimulated: { type: Boolean, default: false },
        isSynthetic: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
      }),
    ],
    default: [],
  })
  players!: Record<string, any>[];

  @ApiProperty()
  @Prop({ default: 'waiting', enum: ['waiting', 'starting', 'in_progress', 'finished'] })
  status!: string;

  @ApiProperty()
  @Prop({ default: 'private', enum: ['public', 'private', 'ranked'] })
  mode!: string;

  @ApiProperty()
  @Prop({ default: 4, min: 2, max: 10 })
  maxPlayers!: number;

  @ApiProperty()
  @Prop({ default: 2, min: 2, max: 10 })
  minPlayers!: number;

  @ApiProperty()
  @Prop({ type: Object, default: {} })
  config!: Record<string, any>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index({ code: 1 }, { unique: true });
RoomSchema.index({ status: 1 });
RoomSchema.index({ hostId: 1 });
