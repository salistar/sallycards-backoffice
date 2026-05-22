/**
 * @file friend.schema.ts
 * @description Relations sociales (amis, demandes en attente, blocages).
 * Une seule ligne par paire (userId1, userId2) avec userId1 < userId2 lexicographique.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type FriendDocument = Friend & Document;
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

@Schema({ timestamps: true, collection: 'friends' })
export class Friend {
  @ApiProperty({ description: 'L\'utilisateur qui a envoye la demande' })
  @Prop({ required: true, index: true })
  requesterId!: string;

  @ApiProperty({ description: 'L\'utilisateur destinataire' })
  @Prop({ required: true, index: true })
  receiverId!: string;

  @ApiProperty({ enum: ['pending', 'accepted', 'blocked'] })
  @Prop({ required: true, enum: ['pending', 'accepted', 'blocked'], default: 'pending', index: true })
  status!: FriendStatus;

  @ApiProperty()
  @Prop({ type: Date, required: true })
  requestedAt!: Date;

  @ApiProperty()
  @Prop({ type: Date })
  acceptedAt?: Date;
}

export const FriendSchema = SchemaFactory.createForClass(Friend);
FriendSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });
FriendSchema.index({ receiverId: 1, status: 1 }); // demandes en attente
