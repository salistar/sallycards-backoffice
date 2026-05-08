'use client';

import { useState } from 'react';

interface StatsCardProps {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  change: string;
  icon?: string;
  color?: string;
}

export default function StatsCard({ label, value, trend, change, icon, color = '#10b981' }: StatsCardProps) {
  const [hovered, setHovered] = useState(false);

  const trendColor =
    trend === 'up' ? '#059669' : trend === 'down' ? '#dc2626' : '#6b7280';
  const trendBg =
    trend === 'up'
      ? 'rgba(5, 150, 105, 0.08)'
      : trend === 'down'
        ? 'rgba(220, 38, 38, 0.08)'
        : 'rgba(107, 114, 128, 0.08)';
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: 24,
        borderRadius: 24,
        transition: 'all 0.3s ease-out',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        border: '1px solid #f3f4f6',
        boxShadow: hovered
          ? '0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.07)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Accent border left */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: hovered ? 4 : 12,
          bottom: hovered ? 4 : 12,
          width: 3,
          borderRadius: 3,
          transition: 'all 0.3s ease-out',
          background: `linear-gradient(180deg, ${color}, ${color}66)`,
        }}
      />

      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header: label + icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>
            {label}
          </span>
          {icon && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                transition: 'all 0.3s ease-out',
                background: `${color}12`,
                transform: hovered ? 'scale(1.1) rotate(6deg)' : 'scale(1)',
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div style={{ fontSize: 32, fontWeight: 900, color: '#111827', marginTop: 8, letterSpacing: '-0.05em' }}>
          {value}
        </div>

        {/* Trend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: trendBg,
              color: trendColor,
            }}
          >
            {trendArrow} {change}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>
            vs semaine derniere
          </span>
        </div>
      </div>
    </div>
  );
}
