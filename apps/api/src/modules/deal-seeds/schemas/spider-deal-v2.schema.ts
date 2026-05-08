/**
 * @file spider-deal-v2.schema.ts — Spider deals pré-générés (format JSON v2.0).
 *
 * Collection `spider_deals_v2` : 100 deals Spider Solitaire générés hors-ligne
 * avec leur séquence COMPLÈTE de tours (état initial + tous les coups jusqu'à
 * la victoire). Chaque tour contient :
 *   - move : { type: 'MOVE'|'FOUNDATION'|'DEAL', from?, to?, count? } (ou null pour turn 0)
 *   - description : libellé humain
 *   - state : { tableau: string[][], stock: string[][], foundations: string[] }
 *
 * Format des cartes : "KS" = roi de pique visible, "ks" = caché (lowercase suit).
 * Suits : S=spades, H=hearts, D=diamonds, C=clubs.
 *
 * NOTE : ce schéma est SÉPARÉ de DealSeed (deal_seeds collection). Il ne sert
 * que de hub de stockage pour le format pré-généré. La conversion vers le
 * format engine se fait côté client (mobile).
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SpiderDealV2Document = SpiderDealV2 & Document;

@Schema({ collection: 'spider_deals_v2', _id: false })
export class SpiderDealV2 {
  @ApiProperty({ description: 'Identifiant du deal (ex: spider_1suit_easy_001)' })
  @Prop({ type: String, required: true })
  _id!: string;

  @ApiProperty({ description: "Variante Spider (ex: '1-suit', '2-suit', '4-suit')" })
  @Prop({ required: true, type: String, index: true })
  variant!: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'] })
  @Prop({ required: true, type: String, index: true })
  difficulty!: string;

  @ApiProperty()
  @Prop({ type: Boolean, default: true })
  solvable!: boolean;

  @ApiProperty({ description: 'Nombre total de tours dans la séquence' })
  @Prop({ type: Number, default: 0 })
  total_turns!: number;

  @ApiProperty({ description: 'Longueur de la solution (généralement total_turns - 1)' })
  @Prop({ type: Number, default: 0 })
  solution_length!: number;

  @ApiProperty({ description: 'Tableau complet des tours (état + coup, format pré-généré)' })
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  turns!: any[];

  @ApiProperty()
  @Prop({ type: Date, default: () => new Date() })
  imported_at!: Date;
}

export const SpiderDealV2Schema = SchemaFactory.createForClass(SpiderDealV2);

// Index combiné pour les requêtes random/list par difficulté + variant
SpiderDealV2Schema.index({ variant: 1, difficulty: 1 });
