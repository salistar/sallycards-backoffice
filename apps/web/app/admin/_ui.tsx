/**
 * @file apps/web/app/admin/_ui.tsx
 * @description Kit UI admin (thème bleu nuit, cohérent avec les apps de jeu).
 */
'use client';

import { ReactNode } from 'react';

export const NAVY = '#0A1535';
export const CARD = '#152A47';
export const GOLD = '#FCD34D';
export const BLUE = '#93C5FD';
export const GAMES3 = ['belote', 'scopa', 'tarot'];
export const ALL_GAMES = ['belote', 'scopa', 'tarot', 'ronda', 'kdoub', 'poker', 'okey', 'concentration', 'solitaire', 'quiestce', 'kantcopy'];

export const card: React.CSSProperties = { background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 };

export function AdminCard({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div style={card}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          {title && <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ display: 'block', color: '#CBD5E1', fontSize: '0.78rem', fontWeight: 700, marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}

export const inputStyle: React.CSSProperties = { width: '100%', background: '#0F2238', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '10px 12px', color: '#fff', outline: 'none', fontSize: '0.9rem' };

export function Btn({ children, onClick, disabled, kind = 'primary' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: 'primary' | 'ghost' | 'danger' }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: NAVY },
    ghost: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' },
    danger: { background: 'rgba(239,68,68,0.85)', color: '#fff' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...styles[kind], border: styles[kind].border || 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 800, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1, fontSize: '0.85rem' }}>{children}</button>;
}

export function Kpi({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div style={card}>
      <div style={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color: accent ? GOLD : '#fff', fontWeight: 900, fontSize: '1.8rem', marginTop: 4 }}>{value}</div>
    </div>
  );
}

/** Petit graphe à barres (séries date→count). */
export function Bars({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, overflowX: 'auto' }}>
      {data.map((d) => (
        <div key={d.date} title={`${d.date}: ${d.count}`} style={{ flex: '1 0 8px', minWidth: 8, height: `${Math.round((d.count / max) * 100)}%`, background: `linear-gradient(180deg, ${GOLD}, #F59E0B)`, borderRadius: '4px 4px 0 0' }} />
      ))}
      {data.length === 0 && <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Pas de données</span>}
    </div>
  );
}

/** Génère et télécharge un CSV à partir de lignes (objets). */
export function downloadCSV(filename: string, rows: any[]) {
  if (!rows || rows.length === 0) { rows = [{ info: 'aucune donnée' }]; }
  const cols = Array.from(rows.reduce((s: Set<string>, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const esc = (v: any) => { const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [cols.join(';'), ...rows.map((r) => cols.map((c) => esc(r[c])).join(';'))].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Flash({ text }: { text: string | null }) {
  if (!text) return null;
  return <div style={{ background: 'rgba(252,211,77,0.12)', border: `1px solid ${GOLD}55`, borderRadius: 10, padding: 12, marginBottom: 14, color: GOLD, fontWeight: 600 }}>{text}</div>;
}
