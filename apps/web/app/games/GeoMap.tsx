/**
 * @file apps/web/app/games/GeoMap.tsx
 * @description Cartes Google pour les défis HKIM/sport.
 *   - StaticRouteMap : image Static Maps (marqueurs Départ A / Arrivée B + tracé).
 *   - MapPicker : carte interactive (Maps JS) ; clique pour poser Départ puis
 *     Arrivée. Sert au gagnant pour définir le parcours imposé aux perdants.
 */
'use client';

import { useEffect, useRef, useState } from 'react';

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface Pt { lat: number; lng: number; label?: string }

/** Bandeau de repli quand la carte Google n'est pas disponible. */
function RouteFallback({ a, b, height }: { a: Pt; b: Pt; height: number }) {
  return (
    <div style={{ height, borderRadius: 10, background: 'linear-gradient(135deg, #0E5A36, #093d24)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>
      🟢 {a.label || 'Départ'} <span style={{ color: '#FCD34D' }}>→</span> 🔴 {b.label || 'Arrivée'}
    </div>
  );
}

/** Image statique d'un parcours A→B (repli propre si l'API Static Maps n'est pas activée). */
export function StaticRouteMap({ a, b, polyline, height = 150 }: { a: Pt; b: Pt; polyline?: string; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (!KEY || failed) return <RouteFallback a={a} b={b} height={height} />;
  const path = polyline
    ? `path=color:0xFCD34Dff|weight:4|enc:${polyline}`
    : `path=color:0xFCD34Dff|weight:4|${a.lat},${a.lng}|${b.lat},${b.lng}`;
  const url = `https://maps.googleapis.com/maps/api/staticmap?size=640x${height * 2}&scale=2`
    + `&markers=color:green|label:A|${a.lat},${a.lng}`
    + `&markers=color:red|label:B|${b.lat},${b.lng}`
    + `&${path}&key=${KEY}`;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Parcours Départ → Arrivée" onError={() => setFailed(true)} style={{ width: '100%', height, objectFit: 'cover', borderRadius: 10, display: 'block' }} />;
}

let mapsPromise: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as any).google?.maps) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}`;
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('maps load failed'));
    document.head.appendChild(s);
  });
  return mapsPromise;
}

/** Carte interactive : 1er clic = Départ (A), 2e clic = Arrivée (B), 3e = reset. */
export function MapPicker({ onPick, height = 240 }: { onPick: (a: Pt, b: Pt | null) => void; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState(false);
  const stateRef = useRef<{ map?: any; a?: any; b?: any; line?: any }>({});

  useEffect(() => {
    if (!KEY) { setErr(true); return; }
    let cancelled = false;
    loadMaps().then(() => {
      if (cancelled || !ref.current) return;
      const g = (window as any).google;
      const map = new g.maps.Map(ref.current, { center: { lat: 33.5731, lng: -7.5898 }, zoom: 12, disableDefaultUI: true, zoomControl: true });
      stateRef.current.map = map;
      map.addListener('click', (e: any) => {
        const st = stateRef.current;
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        if (st.a && st.b) { st.a.setMap(null); st.b.setMap(null); st.line?.setMap(null); st.a = undefined; st.b = undefined; st.line = undefined; }
        if (!st.a) {
          st.a = new g.maps.Marker({ position: pos, map, label: 'A', title: 'Départ' });
          onPick({ ...pos, label: 'Départ' }, null);
        } else if (!st.b) {
          st.b = new g.maps.Marker({ position: pos, map, label: 'B', title: 'Arrivée' });
          st.line = new g.maps.Polyline({ path: [st.a.getPosition(), pos], map, strokeColor: '#FCD34D', strokeWeight: 4 });
          onPick({ lat: st.a.getPosition().lat(), lng: st.a.getPosition().lng(), label: 'Départ' }, { ...pos, label: 'Arrivée' });
        }
      });
    }).catch(() => setErr(true));
    return () => { cancelled = true; };
  }, [onPick]);

  if (err || !KEY) {
    return <div style={{ height, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.82rem', textAlign: 'center', padding: 12 }}>Carte Google indisponible. Le parcours par défaut (Casablanca) sera utilisé.</div>;
  }
  return <div ref={ref} style={{ height, width: '100%', borderRadius: 10, overflow: 'hidden' }} />;
}
