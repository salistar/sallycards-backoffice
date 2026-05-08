import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SeedHistoryDocument = SeedHistoryEntry & Document;

/**
 * Snapshot horaire (ou ad-hoc) du remplissage de la BD.
 * Permet de tracker l'évolution dans le temps :
 *  - quand a-t-on atteint 100/variante ?
 *  - combien de submit utilisateur reçus par jour ?
 *  - couverture solution % au cours du temps ?
 */
@Schema({ timestamps: true, collection: 'seed_history' })
export class SeedHistoryEntry {
  @ApiProperty({ description: 'Timestamp du snapshot' })
  @Prop({ required: true, type: Date, default: Date.now, index: true })
  timestamp!: Date;

  @ApiProperty({ description: 'Nombre total de seeds en BD à ce moment' })
  @Prop({ required: true, type: Number })
  grandTotal!: number;

  @ApiProperty({ description: 'Nombre total de seeds avec solution non-vide' })
  @Prop({ required: true, type: Number })
  grandWithSolution!: number;

  @ApiProperty({ description: 'Total par variante { variant: count }' })
  @Prop({ type: Object, default: {} })
  perVariant!: Record<string, number>;

  @ApiProperty({ description: 'Origine du snapshot (cron / ad-hoc / startup)' })
  @Prop({ type: String, default: 'periodic' })
  source!: string;
}

export const SeedHistorySchema = SchemaFactory.createForClass(SeedHistoryEntry);
SeedHistorySchema.index({ timestamp: -1 });
