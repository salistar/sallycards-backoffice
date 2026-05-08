import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type DealSeedDocument = DealSeed & Document;

export enum SolitaireVariant {
  KLONDIKE_1 = 'klondike-1',
  KLONDIKE_3 = 'klondike-3',
  KLONDIKE_VEGAS = 'klondike-vegas',
  SPIDER_1 = 'spider-1',
  SPIDER_2 = 'spider-2',
  SPIDER_4 = 'spider-4',
  FREECELL = 'freecell',
  YUKON = 'yukon',
  GOLF = 'golf',
  PYRAMID = 'pyramid',
  TRIPEAKS = 'tripeaks',
  FORTY_THIEVES = 'forty-thieves',
  ACCORDION = 'accordion',
}

@Schema({ timestamps: true, collection: 'deal_seeds' })
export class DealSeed {
  @ApiProperty({ enum: SolitaireVariant, description: 'Variante du solitaire' })
  @Prop({ required: true, enum: SolitaireVariant, index: true })
  variant!: string;

  @ApiProperty({ description: 'Index séquentiel du seed (0..99 typiquement)' })
  @Prop({ required: true, type: Number, default: 0 })
  seedIndex!: number;

  @ApiProperty({ description: 'État de jeu initial (GameState complet sérialisé)' })
  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  initialState!: any;

  @ApiProperty({ description: 'Solution greedy (séquence de GameAction[])' })
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  solution!: any[];

  @ApiProperty({ description: 'Difficulté estimée (basée sur la longueur de solution)' })
  @Prop({ type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Hash unique de la donne pour éviter les doublons' })
  @Prop({ required: true, index: true })
  dealHash!: string;

  @ApiProperty({ description: 'Métadonnées additionnelles' })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: any;

  createdAt!: Date;
  updatedAt!: Date;
}

export const DealSeedSchema = SchemaFactory.createForClass(DealSeed);

// Index unique : pas de doublons dans le même variant
DealSeedSchema.index({ variant: 1, dealHash: 1 }, { unique: true });
DealSeedSchema.index({ variant: 1, difficulty: 1 });
DealSeedSchema.index({ variant: 1, seedIndex: 1 });
