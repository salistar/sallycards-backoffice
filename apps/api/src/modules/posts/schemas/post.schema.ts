/**
 * @file post.schema.ts
 * @description Mur de partage : posts libres par jeu (collection wall_posts).
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true, collection: 'wall_posts' })
export class Post {
  @Prop({ required: true, index: true })
  gameType!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ default: 'Joueur' })
  username!: string;

  @Prop({ required: true, maxlength: 280 })
  text!: string;

  @Prop({ type: [String], default: [] })
  likes!: string[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
