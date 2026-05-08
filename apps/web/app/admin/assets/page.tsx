'use client';

import { useState, useEffect } from 'react';

interface AssetSource {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  cards: number;
  icon: string;
}

const SOURCES: AssetSource[] = [
  { name: 'CDN Principal', status: 'healthy', lastCheck: 'Il y a 2 min', cards: 520, icon: '\u{1F310}' },
  { name: 'Stockage Backup', status: 'healthy', lastCheck: 'Il y a 5 min', cards: 520, icon: '\u{1F4BE}' },
  { name: 'Generateur SVG', status: 'degraded', lastCheck: 'Il y a 1 min', cards: 480, icon: '\u{1F3A8}' },
];

const STATUS_MAP: Record<
  string,
  { color: string; dot: string; label: string; health: number }
> = {
  healthy: {
    color: '#10b981',
    dot: '#10b981',
    label: 'Operationnel',
    health: 100,
  },
  degraded: {
    color: '#f59e0b',
    dot: '#f59e0b',
    label: 'Degrade',
    health: 72,
  },
  down: {
    color: '#ef4444',
    dot: '#ef4444',
    label: 'Hors service',
    health: 0,
  },
};

const CARD_SUITS = ['\u2660', '\u2665', '\u2666', '\u2663'];
const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const fmt = new Intl.NumberFormat('fr-FR');

export default function AssetsPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [sources, setSources] = useState(SOURCES);
  const [storageUsed, setStorageUsed] = useState(2.4);
  const [storageTotal, setStorageTotal] = useState(5.0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssetStatus = async () => {
      try {
        const { apiClient } = await import('../../lib/api');
        const data = await apiClient.getAssetStatus();
        setSources(data.sources.map((s: any) => ({ ...s, icon: s.icon || '\u{1F310}' })));
        setStorageUsed(data.storageUsed);
        setStorageTotal(data.storageTotal);
      } catch (error) {
        // API unavailable, using mock data
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssetStatus();
  }, []);

  const storagePercent = (storageUsed / storageTotal) * 100;
  const storageFree = storageTotal - storageUsed;
  const storageColor =
    storagePercent < 70 ? '#10b981' : storagePercent < 90 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, padding: 32 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 8, letterSpacing: '-0.04em', margin: '0 0 8px 0' }}>
          Gestion des Assets
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
          Surveillance des sources, stockage et apercu complet de la galerie de cartes.
        </p>
      </div>

      {/* Source Health Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {sources.map((src) => {
          const st = STATUS_MAP[src.status];
          return (
            <div
              key={src.name}
              style={{
                borderRadius: 24,
                padding: 24,
                transition: 'all 0.3s ease-out',
                cursor: 'default',
                background: 'white',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={() => setHoveredSource(src.name)}
              onMouseLeave={() => setHoveredSource(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 24 }}>{src.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.04em', margin: 0 }}>{src.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'inline-block',
                        backgroundColor: st.dot,
                        boxShadow: `0 0 6px ${st.dot}`,
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 16, color: '#6b7280' }}>
                <span>{fmt.format(src.cards)} cartes</span>
                <span>{src.lastCheck}</span>
              </div>

              {/* Health progress bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>
                    Sante
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: st.color }}>
                    {st.health}%
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, borderRadius: 9999, overflow: 'hidden', background: '#e5e7eb' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 9999,
                      transition: 'all 0.3s ease-out',
                      width: `${st.health}%`,
                      backgroundColor: st.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Storage Usage with Donut Chart */}
      <div style={{ borderRadius: 24, padding: 32, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 12, fontWeight: 900, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#9ca3af', margin: '0 0 24px 0' }}>
          Utilisation du stockage
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32 }}>
          {/* Donut ring chart */}
          <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(${storageColor} 0deg, ${storageColor} ${storagePercent * 3.6}deg, #e5e7eb ${storagePercent * 3.6}deg, #e5e7eb 360deg)`,
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 12,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
            }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#111827' }}>
                {storagePercent.toFixed(0)}%
              </span>
              <span style={{ fontSize: 11, marginTop: 2, color: '#9ca3af' }}>
                utilise
              </span>
            </div>
          </div>

          {/* Storage labels */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: 'inline-block',
                  backgroundColor: storageColor,
                }}
              />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
                  {storageUsed.toFixed(1)} Go utilises
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                  {storagePercent.toFixed(1)}% de la capacite totale
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: 2, flexShrink: 0, display: 'inline-block', backgroundColor: '#e5e7eb' }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>
                  {storageFree.toFixed(1)} Go disponibles
                </p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0 0' }}>
                  {(100 - storagePercent).toFixed(1)}% restant sur {storageTotal.toFixed(1)} Go
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Gallery */}
      <div style={{ borderRadius: 24, padding: 32, background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', margin: 0 }}>Galerie des Cartes</h3>
          <p style={{ fontSize: 12, marginTop: 4, color: '#6b7280', margin: '4px 0 0 0' }}>
            {fmt.format(CARD_SUITS.length * CARD_VALUES.length)} cartes au total
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 8 }}>
          {CARD_SUITS.map((suit) =>
            CARD_VALUES.map((val) => {
              const key = `${suit}-${val}`;
              const isRed = suit === '\u2665' || suit === '\u2666';
              const isHovered = hoveredCard === key;
              return (
                <div
                  key={key}
                  style={{
                    aspectRatio: '2.5 / 3.5',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    transform: isHovered
                      ? 'scale(1.1) translateY(-4px) rotate(2deg)'
                      : 'scale(1)',
                    boxShadow: isHovered
                      ? `0 12px 28px rgba(0,0,0,0.15), 0 0 0 2px ${isRed ? '#ef4444' : '#334155'}`
                      : '0 2px 6px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    zIndex: isHovered ? 10 : 1,
                    position: 'relative',
                    border: '1px solid #e5e7eb',
                  }}
                  onMouseEnter={() => setHoveredCard(key)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <span style={{ color: isRed ? '#dc2626' : '#1e293b' }}>{val}</span>
                  <span style={{ fontSize: 14, color: isRed ? '#dc2626' : '#1e293b' }}>
                    {suit}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
