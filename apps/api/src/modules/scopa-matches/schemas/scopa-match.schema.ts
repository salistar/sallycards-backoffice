import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ScopaMatchDocument = ScopaMatch & Document;
export type ScopaMatchStatus = 'waiting' | 'playing' | 'finished';

export interface ScopaPlayerProgress {
  userId: string;
  displayName: string;
  /** Cartes capturées (count). */
  capturedCount: number;
  /** Nb de Scopa! réalisés cette manche. */
  scopas: number;
  /** Nb de Denari capturés. */
  denariCount: number;
  /** Settebello (7 d'Or) capturé ? */
  settebello: boolean;
  /** Score primiera (somme valeurs Primiera des 4 meilleures cartes par couleur). */
  primieraScore: number;
  /** Score final manche. */
  score: number;
  finished: boolean;
  finishedAt: number | null;
  joinedAt: number;
}

@Schema({ timestamps: true, collection: 'scopa_matches' })
export class ScopaMatch {
  @ApiProperty({ description: 'Code court (ex: ABCD12) pour rejoindre' })
  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @ApiProperty({ description: 'Variante (classic, scopone, escoba, scopaAssi, ...)' })
  @Prop({ required: true, index: true })
  variant!: string;

  @ApiProperty()
  @Prop({ default: 'medium' })
  difficulty!: string;

  @ApiProperty({ description: 'Score à atteindre pour gagner la partie (11 ou 21)' })
  @Prop({ default: 11 })
  targetScore!: number;

  @ApiProperty({ description: 'Status: waiting / playing / finished' })
  @Prop({ type: String, enum: ['waiting', 'playing', 'finished'], default: 'waiting' })
  status!: ScopaMatchStatus;

  @ApiProperty()
  @Prop({ type: [Object], default: [] })
  players!: ScopaPlayerProgress[];

  @ApiProperty()
  @Prop({ type: String, default: null })
  winnerId!: string | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  startedAt!: number | null;

  @ApiProperty()
  @Prop({ type: Number, default: null })
  finishedAt!: number | null;
}

export const ScopaMatchSchema = SchemaFactory.createForClass(ScopaMatch);
ScopaMatchSchema.index({ status: 1, variant: 1, createdAt: -1 });
