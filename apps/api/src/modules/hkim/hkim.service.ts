/**
 * @file hkim.service.ts
 * @description Logique métier des "hkim" (trajectoires), MULTI-JEUX.
 * Chaque jeu a sa PROPRE collection Mongo : hkim_<jeu>
 * (ex: hkim_kdoub, hkim_belote, hkim_poker, …) via un modèle créé
 * dynamiquement sur la connexion Mongoose.
 */
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import {
  HkimTrajectory,
  HkimTrajectorySchema,
} from './schemas/hkim-trajectory.schema';

const COUNT = 10;
const EARTH_KM_PER_DEG_LAT = 110.574;
const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAa1lBSroSXA-Om4mio84-SWAcmzQgYv8w';

async function fetchRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  fallbackMeters: number,
): Promise<{ polyline: string; distance: number }> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${start.lat},${start.lng}` +
      `&destination=${end.lat},${end.lng}` +
      `&mode=walking&key=${GOOGLE_MAPS_KEY}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const j: any = await res.json();
    if (j.status === 'OK' && j.routes?.length) {
      const r = j.routes[0];
      const dist = r.legs?.[0]?.distance?.value ?? fallbackMeters;
      return { polyline: r.overview_polyline?.points || '', distance: dist };
    }
  } catch {
    /* timeout / réseau → fallback */
  }
  return { polyline: '', distance: fallbackMeters };
}

@Injectable()
export class HkimService {
  private readonly cache = new Map<string, Model<HkimTrajectory>>();

  constructor(
    @InjectConnection() private readonly conn: Connection,
  ) {}

  /** Normalise le nom du jeu (slug sûr pour nom de collection). */
  private slug(game: string): string {
    return (
      String(game || 'kdoub')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 24) || 'kdoub'
    );
  }

  /** Modèle Mongoose lié à la collection hkim_<jeu> (mémoïsé). */
  private m(game: string): Model<HkimTrajectory> {
    const g = this.slug(game);
    let mdl = this.cache.get(g);
    if (!mdl) {
      const modelName = `Hkim_${g}`;
      mdl =
        (this.conn.models[modelName] as Model<HkimTrajectory>) ||
        this.conn.model<HkimTrajectory>(
          modelName,
          HkimTrajectorySchema,
          `hkim_${g}`,
        );
      this.cache.set(g, mdl);
    }
    return mdl;
  }

  async listForUser(
    game: string,
    userId: string,
    lat?: number,
    lng?: number,
    username = 'Joueur',
  ) {
    const M = this.m(game);
    const existing = await M.find({ userId }).sort({ order: 1 }).lean();
    if (existing.length > 0) return existing;
    if (lat == null || lng == null) return [];
    return this.generate(game, userId, lat, lng, username);
  }

  async generate(
    game: string,
    userId: string,
    lat: number,
    lng: number,
    username = 'Joueur',
  ) {
    const M = this.m(game);
    await M.deleteMany({ userId, seeded: { $ne: true } });

    const kmPerDegLng =
      EARTH_KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180) ||
      EARTH_KM_PER_DEG_LAT;
    const offset = (km: number, perDeg: number) =>
      ((Math.random() < 0.5 ? -1 : 1) * km) / perDeg;

    const specs = Array.from({ length: COUNT }).map((_, i) => {
      const startLat = lat + offset(0.3 + Math.random() * 1.2, EARTH_KM_PER_DEG_LAT);
      const startLng = lng + offset(0.3 + Math.random() * 1.2, kmPerDegLng);
      const distKm = 1 + Math.random() * 3;
      const brg = Math.random() * 2 * Math.PI;
      const endLat = startLat + (distKm * Math.cos(brg)) / EARTH_KM_PER_DEG_LAT;
      const endLng = startLng + (distKm * Math.sin(brg)) / kmPerDegLng;
      const days = 2 + Math.floor(Math.random() * 12);
      return {
        i,
        start: { lat: +startLat.toFixed(6), lng: +startLng.toFixed(6) },
        end: { lat: +endLat.toFixed(6), lng: +endLng.toFixed(6) },
        crowKm: distKm,
        maxDate: new Date(Date.now() + days * 24 * 3600 * 1000),
      };
    });

    const routes = await Promise.all(
      specs.map((sp) => fetchRoute(sp.start, sp.end, Math.round(sp.crowKm * 1000))),
    );

    const docs = specs.map((sp, idx) => ({
      userId,
      username,
      name: `Hkim ${sp.i + 1}`,
      order: sp.i + 1,
      start: { ...sp.start, label: `Départ ${sp.i + 1}` },
      end: { ...sp.end, label: `Arrivée ${sp.i + 1}` },
      distanceMeters: routes[idx].distance,
      routePolyline: routes[idx].polyline,
      maxDate: sp.maxDate,
      status: 'pending' as const,
    }));

    await M.insertMany(docs);
    return M.find({ userId }).sort({ order: 1 }).lean();
  }

  async complete(game: string, userId: string, id: string) {
    return this.m(game).findOneAndUpdate(
      { _id: id, userId },
      { status: 'done', completedAt: new Date() },
      { new: true },
    );
  }

  async summary(game: string, userId: string) {
    const all = await this.m(game)
      .find({ userId })
      .sort({ order: 1 })
      .lean();
    return {
      total: all.length,
      done: all.filter((h) => h.status === 'done').length,
      pending: all.filter((h) => h.status === 'pending').length,
      items: all,
    };
  }

  async seedHistory(
    game: string,
    userId: string,
    lat: number,
    lng: number,
    username = 'Joueur',
  ) {
    const mine = await this.generateDone(game, userId, username, lat, lng, 10, 101);
    const others = ['Aymane', 'Salma', 'Yassine', 'Khadija', 'Omar', 'Imane'];
    let extra = 0;
    for (let k = 0; k < others.length; k++) {
      const n = 2 + Math.floor(Math.random() * 2);
      await this.generateDone(
        game,
        `seed-user-${k + 1}`,
        others[k],
        lat,
        lng,
        n,
        1,
        true,
      );
      extra += n;
    }
    return { mine, others: extra };
  }

  private async generateDone(
    game: string,
    userId: string,
    username: string,
    lat: number,
    lng: number,
    count: number,
    orderStart: number,
    forceDelete = false,
  ) {
    const M = this.m(game);
    await M.deleteMany({ userId, seeded: true });

    const kmLng =
      EARTH_KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180) ||
      EARTH_KM_PER_DEG_LAT;
    const off = (km: number, per: number) =>
      ((Math.random() < 0.5 ? -1 : 1) * km) / per;

    const specs = Array.from({ length: count }).map((_, i) => {
      const sLat = lat + off(0.4 + Math.random() * 2, EARTH_KM_PER_DEG_LAT);
      const sLng = lng + off(0.4 + Math.random() * 2, kmLng);
      const d = 1 + Math.random() * 3;
      const b = Math.random() * 2 * Math.PI;
      const eLat = sLat + (d * Math.cos(b)) / EARTH_KM_PER_DEG_LAT;
      const eLng = sLng + (d * Math.sin(b)) / kmLng;
      const ago = Math.floor(Math.random() * 30 * 24 * 3600 * 1000);
      return {
        i,
        start: { lat: +sLat.toFixed(6), lng: +sLng.toFixed(6) },
        end: { lat: +eLat.toFixed(6), lng: +eLng.toFixed(6) },
        crow: Math.round(d * 1000),
        completedAt: new Date(Date.now() - ago),
      };
    });

    const routes = await Promise.all(
      specs.map((s) => fetchRoute(s.start, s.end, s.crow)),
    );

    const docs = specs.map((s, idx) => ({
      userId,
      username,
      name: `Hkim ${orderStart + s.i}`,
      order: orderStart + s.i,
      start: { ...s.start, label: `Départ ${orderStart + s.i}` },
      end: { ...s.end, label: `Arrivée ${orderStart + s.i}` },
      distanceMeters: routes[idx].distance,
      routePolyline: routes[idx].polyline,
      maxDate: s.completedAt,
      status: 'done' as const,
      completedAt: s.completedAt,
      seeded: true,
      comments: [],
    }));
    await M.insertMany(docs);
    return docs.length;
  }

  async feed(game: string, limit = 30) {
    const items = await this.m(game)
      .find({ status: 'done', completedAt: { $ne: null } })
      .sort({ completedAt: -1 })
      .limit(limit)
      .lean();
    return items.map((h: any) => ({
      hkimId: String(h._id),
      userId: h.userId,
      username: h.username || 'Joueur',
      name: h.name,
      from: h.start?.label || 'Départ',
      to: h.end?.label || 'Arrivée',
      start: h.start,
      end: h.end,
      distanceMeters: h.distanceMeters,
      completedAt: h.completedAt,
      comments: (h.comments || []).map((c: any) => ({
        username: c.username,
        text: c.text,
        createdAt: c.createdAt,
      })),
    }));
  }

  async addComment(
    game: string,
    id: string,
    userId: string,
    username: string,
    text: string,
  ) {
    const clean = String(text || '').trim().slice(0, 280);
    if (!clean) return null;
    const doc = await this.m(game).findByIdAndUpdate(
      id,
      {
        $push: {
          comments: { userId, username, text: clean, createdAt: new Date() },
        },
      },
      { new: true },
    );
    return doc?.comments || [];
  }

  async getComments(game: string, id: string) {
    const doc = await this.m(game).findById(id).lean();
    return (doc as any)?.comments || [];
  }
}
