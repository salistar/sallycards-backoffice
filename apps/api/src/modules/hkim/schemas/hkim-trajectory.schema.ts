/**
 * @file hkim-trajectory.schema.ts
 * @description Schéma Mongoose pour les "hkim" : trajectoires assignées à un
 * utilisateur (point de départ → point d'arrivée + date max). 10 par user,
 * générées automatiquement autour de sa position GPS au premier appel.
 *
 * Lifecycle : créées via `GET /hkim?lat&lng` (auto-seed si vide) ou
 * `POST /hkim/generate`. Marquées terminées via `POST /hkim/:id/complete`.
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HkimTrajectoryDocument = HydratedDocument<HkimTrajectory>;

@Schema({ _id: false })
export class GeoPoint {
  @Prop({ required: true })
  lat!: number;

  @Prop({ required: true })
  lng!: number;

  @Prop({ required: true })
  label!: string;
}
export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ _id: false, timestamps: { createdAt: true, updatedAt: false } })
export class HkimComment {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  username!: string;

  @Prop({ required: true })
  text!: string;

  @Prop({ default: () => new Date() })
  createdAt!: Date;
}
export const HkimCommentSchema = SchemaFactory.createForClass(HkimComment);

@Schema({ collection: 'hkim_trajectories', timestamps: true })
export class HkimTrajectory {
  /** Propriétaire (req.user.userId du JWT). */
  @Prop({ required: true, index: true })
  userId!: string;

  /** Nom d'affichage du propriétaire (pour le fil d'actualité). */
  @Prop({ default: 'Joueur' })
  username!: string;

  /** Trajet seedé pour démo (historique / feed autres users). */
  @Prop({ default: false })
  seeded?: boolean;

  /** Commentaires sur l'exploit. */
  @Prop({ type: [HkimCommentSchema], default: [] })
  comments!: HkimComment[];

  /** Nom affiché — ex. "Hkim 1". */
  @Prop({ required: true })
  name!: string;

  /** Index 1..10 dans la liste de l'utilisateur. */
  @Prop({ required: true })
  order!: number;

  @Prop({ type: GeoPointSchema, required: true })
  start!: GeoPoint;

  @Prop({ type: GeoPointSchema, required: true })
  end!: GeoPoint;

  /** Distance réelle de l'itinéraire routier (mètres). */
  @Prop({ required: true })
  distanceMeters!: number;

  /**
   * Polyline encodée (format Google) de l'itinéraire routier réel
   * départ→arrivée. Vide si Directions n'a pas trouvé de route
   * (fallback ligne directe côté client).
   */
  @Prop({ default: '' })
  routePolyline?: string;

  /** Date limite pour effectuer le trajet. */
  @Prop({ required: true, index: true })
  maxDate!: Date;

  @Prop({ required: true, enum: ['pending', 'done'], default: 'pending', index: true })
  status!: 'pending' | 'done';

  @Prop()
  completedAt?: Date;
}

export const HkimTrajectorySchema = SchemaFactory.createForClass(HkimTrajectory);
HkimTrajectorySchema.index({ userId: 1, order: 1 }, { unique: true });
