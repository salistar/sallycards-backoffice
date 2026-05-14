/**
 * @file apps/web/app/components/BrandLogo.tsx
 * @description Web port pixel-perfect du composant React Native BrandLogo
 * utilisé dans l'écran de choix de langue de l'app mobile Sally Solitaire.
 *
 * Géométrie 1:1 avec apps-deploy/sally-solitaire/src/components/BrandLogo.tsx :
 *   - Carte arrière gauche : carreau (♦), rotation -26°, gradient indigo/violet
 *   - Carte arrière droite : trèfle (♣), rotation +26°, gradient indigo/violet
 *   - Carte avant centrale : As de Pique (A♠) sur gradient violet→magenta→rose,
 *     avec indices coin haut-gauche et bas-droite + grand ♠ central
 *
 * Toutes les couleurs et ratios reproduisent le composant mobile exactement.
 */

interface Props {
  size?: number;
  accent?: string;
}

export function BrandLogo({ size = 110, accent = '#FCD34D' }: Props) {
  const cardW = size * 0.56;
  const cardH = size;
  const radius = size * 0.11;
  const innerMargin = Math.max(2, size * 0.03);

  const cardBaseStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${cardW}px`,
    height: `${cardH}px`,
    borderRadius: `${radius}px`,
    backgroundColor: '#fff',
    boxShadow: '0 14px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const innerBorderStyle = (color: string): React.CSSProperties => ({
    position: 'absolute',
    inset: `${innerMargin * 1.5}px`,
    borderRadius: `${radius - innerMargin * 1.5}px`,
    border: `1px solid ${color}`,
    pointerEvents: 'none',
  });

  const suitCornerStyle = (corner: 'tl' | 'br'): React.CSSProperties => ({
    position: 'absolute',
    [corner === 'tl' ? 'top' : 'bottom']: 6,
    [corner === 'tl' ? 'left' : 'right']: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: corner === 'br' ? 'rotate(180deg)' : 'none',
    lineHeight: 1,
  });

  return (
    <div
      role="img"
      aria-label="Sally Solitaire logo"
      style={{
        position: 'relative',
        width: `${size * 1.78}px`,
        height: `${size * 1.22}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Back-left card — Diamond (♦) */}
      <div
        style={{
          ...cardBaseStyle,
          transform: 'rotate(-26deg) translateX(' + (-cardW * 0.58) + 'px) translateY(' + (cardH * 0.04) + 'px)',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: `${innerMargin}px`,
            borderRadius: `${radius - innerMargin}px`,
            background: 'linear-gradient(135deg, #0F172A 0%, #312E81 100%)',
          }}
        />
        <div style={innerBorderStyle('rgba(255,213,128,0.35)')} />
        {/* corner indices */}
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            color: accent,
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          ♦
        </span>
        <span
          style={{
            color: accent,
            fontSize: size * 0.58,
            fontWeight: 900,
            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
            lineHeight: 1,
          }}
        >
          ♦
        </span>
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            color: accent,
            fontSize: 14,
            fontWeight: 900,
            transform: 'rotate(180deg)',
            lineHeight: 1,
          }}
        >
          ♦
        </span>
      </div>

      {/* Back-right card — Club (♣) */}
      <div
        style={{
          ...cardBaseStyle,
          transform: 'rotate(26deg) translateX(' + (cardW * 0.58) + 'px) translateY(' + (cardH * 0.04) + 'px)',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: `${innerMargin}px`,
            borderRadius: `${radius - innerMargin}px`,
            background: 'linear-gradient(135deg, #0F172A 0%, #312E81 100%)',
          }}
        />
        <div style={innerBorderStyle('rgba(255,213,128,0.35)')} />
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            color: accent,
            fontSize: 14,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          ♣
        </span>
        <span
          style={{
            color: accent,
            fontSize: size * 0.58,
            fontWeight: 900,
            textShadow: '0 2px 6px rgba(0,0,0,0.4)',
            lineHeight: 1,
          }}
        >
          ♣
        </span>
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            color: accent,
            fontSize: 14,
            fontWeight: 900,
            transform: 'rotate(180deg)',
            lineHeight: 1,
          }}
        >
          ♣
        </span>
      </div>

      {/* Front card — Ace of Spades on purple-magenta-pink gradient */}
      <div
        style={{
          ...cardBaseStyle,
          zIndex: 3,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: `${innerMargin}px`,
            borderRadius: `${radius - innerMargin}px`,
            background: 'linear-gradient(135deg, #7C3AED 0%, #A21CAF 50%, #DB2777 100%)',
          }}
        />
        <div style={innerBorderStyle('rgba(255,255,255,0.32)')} />
        {/* corner top-left: A + ♠ */}
        <div style={suitCornerStyle('tl')}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>A</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>♠</span>
        </div>
        {/* corner bottom-right (rotated): A + ♠ */}
        <div style={suitCornerStyle('br')}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>A</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>♠</span>
        </div>
        {/* big center spade */}
        <span
          style={{
            color: accent,
            fontSize: size * 0.62,
            fontWeight: 900,
            textShadow: '0 2px 8px rgba(0,0,0,0.45)',
            lineHeight: 1,
            position: 'relative',
            top: `-${size * 0.04}px`,
          }}
        >
          ♠
        </span>
      </div>
    </div>
  );
}
