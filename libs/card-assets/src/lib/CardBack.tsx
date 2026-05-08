/**
 * CardBack.tsx
 * Five SVG-based card back designs using react-native-svg primitives.
 */

import React from 'react';
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
  G,
  Defs,
  Pattern,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CardBackProps {
  design: 1 | 2 | 3 | 4 | 5;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Design 1: Moroccan Zellige (geometric pattern, gold/blue)
// ---------------------------------------------------------------------------

const ZelligeDesign: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const cellSize = 20;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Pattern id="zellige" x="0" y="0" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
          {/* Dark blue background tile */}
          <Rect x="0" y="0" width={cellSize} height={cellSize} fill="#1B3A5C" />
          {/* Gold star shape via overlapping paths */}
          <Path
            d={`M${cellSize / 2} 2 L${cellSize / 2 + 3} ${cellSize / 2 - 3} L${cellSize - 2} ${cellSize / 2} L${cellSize / 2 + 3} ${cellSize / 2 + 3} L${cellSize / 2} ${cellSize - 2} L${cellSize / 2 - 3} ${cellSize / 2 + 3} L2 ${cellSize / 2} L${cellSize / 2 - 3} ${cellSize / 2 - 3} Z`}
            fill="#C9A84C"
            opacity={0.9}
          />
          {/* Inner diamond */}
          <Path
            d={`M${cellSize / 2} ${cellSize / 2 - 4} L${cellSize / 2 + 4} ${cellSize / 2} L${cellSize / 2} ${cellSize / 2 + 4} L${cellSize / 2 - 4} ${cellSize / 2} Z`}
            fill="#1B3A5C"
          />
          {/* Center dot */}
          <Circle cx={cellSize / 2} cy={cellSize / 2} r={1.5} fill="#C9A84C" />
        </Pattern>
      </Defs>
      {/* Card background */}
      <Rect x="0" y="0" width={width} height={height} rx={8} fill="#0F2440" />
      {/* Pattern fill area */}
      <Rect x="6" y="6" width={width - 12} height={height - 12} rx={4} fill="url(#zellige)" />
      {/* Border */}
      <Rect x="4" y="4" width={width - 8} height={height - 8} rx={6} fill="none" stroke="#C9A84C" strokeWidth={1.5} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Design 2: Arabesque (green/gold curves)
// ---------------------------------------------------------------------------

const ArabesqueDesign: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const cx = width / 2;
  const cy = height / 2;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="arabBg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1A4D2E" />
          <Stop offset="1" stopColor="#0D2818" />
        </LinearGradient>
        <Pattern id="arabesque" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          {/* Interlocking arches */}
          <Path d="M0 20 Q10 0 20 20 Q30 40 40 20" fill="none" stroke="#C9A84C" strokeWidth={0.8} opacity={0.7} />
          <Path d="M0 20 Q10 40 20 20 Q30 0 40 20" fill="none" stroke="#C9A84C" strokeWidth={0.8} opacity={0.7} />
          <Circle cx="20" cy="20" r="3" fill="none" stroke="#C9A84C" strokeWidth={0.5} opacity={0.5} />
          <Circle cx="0" cy="20" r="2" fill="#C9A84C" opacity={0.4} />
          <Circle cx="40" cy="20" r="2" fill="#C9A84C" opacity={0.4} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} rx={8} fill="url(#arabBg)" />
      <Rect x="8" y="8" width={width - 16} height={height - 16} rx={4} fill="url(#arabesque)" />
      {/* Central medallion */}
      <Circle cx={cx} cy={cy} r={Math.min(width, height) * 0.18} fill="none" stroke="#C9A84C" strokeWidth={1.5} />
      <Circle cx={cx} cy={cy} r={Math.min(width, height) * 0.12} fill="none" stroke="#C9A84C" strokeWidth={0.8} />
      {/* 8-pointed star in center */}
      <Path
        d={`M${cx} ${cy - 14} L${cx + 5} ${cy - 5} L${cx + 14} ${cy} L${cx + 5} ${cy + 5} L${cx} ${cy + 14} L${cx - 5} ${cy + 5} L${cx - 14} ${cy} L${cx - 5} ${cy - 5} Z`}
        fill="#C9A84C"
        opacity={0.8}
      />
      {/* Gold border */}
      <Rect x="4" y="4" width={width - 8} height={height - 8} rx={6} fill="none" stroke="#C9A84C" strokeWidth={1.5} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Design 3: Spanish Azulejo (red/gold tiles)
// ---------------------------------------------------------------------------

const AzulejoDesign: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const tileSize = 24;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Pattern id="azulejo" x="0" y="0" width={tileSize} height={tileSize} patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width={tileSize} height={tileSize} fill="#8B1A1A" />
          {/* Cross pattern */}
          <Line x1={tileSize / 2} y1="0" x2={tileSize / 2} y2={tileSize} stroke="#C9A84C" strokeWidth={0.8} opacity={0.6} />
          <Line x1="0" y1={tileSize / 2} x2={tileSize} y2={tileSize / 2} stroke="#C9A84C" strokeWidth={0.8} opacity={0.6} />
          {/* Diagonal accents */}
          <Line x1="0" y1="0" x2={tileSize / 2} y2={tileSize / 2} stroke="#D4A843" strokeWidth={0.4} opacity={0.4} />
          <Line x1={tileSize} y1="0" x2={tileSize / 2} y2={tileSize / 2} stroke="#D4A843" strokeWidth={0.4} opacity={0.4} />
          <Line x1="0" y1={tileSize} x2={tileSize / 2} y2={tileSize / 2} stroke="#D4A843" strokeWidth={0.4} opacity={0.4} />
          <Line x1={tileSize} y1={tileSize} x2={tileSize / 2} y2={tileSize / 2} stroke="#D4A843" strokeWidth={0.4} opacity={0.4} />
          {/* Center diamond */}
          <Path
            d={`M${tileSize / 2} ${tileSize / 2 - 4} L${tileSize / 2 + 4} ${tileSize / 2} L${tileSize / 2} ${tileSize / 2 + 4} L${tileSize / 2 - 4} ${tileSize / 2} Z`}
            fill="#D4A843"
            opacity={0.7}
          />
          {/* Corner dots */}
          <Circle cx="0" cy="0" r={1.5} fill="#D4A843" opacity={0.5} />
          <Circle cx={tileSize} cy="0" r={1.5} fill="#D4A843" opacity={0.5} />
          <Circle cx="0" cy={tileSize} r={1.5} fill="#D4A843" opacity={0.5} />
          <Circle cx={tileSize} cy={tileSize} r={1.5} fill="#D4A843" opacity={0.5} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} rx={8} fill="#6B1010" />
      <Rect x="6" y="6" width={width - 12} height={height - 12} rx={4} fill="url(#azulejo)" />
      <Rect x="4" y="4" width={width - 8} height={height - 8} rx={6} fill="none" stroke="#D4A843" strokeWidth={1.5} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Design 4: SallyCards Logo (gradient + centered S)
// ---------------------------------------------------------------------------

const LogoDesign: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const cx = width / 2;
  const cy = height / 2;
  const fontSize = Math.min(width, height) * 0.35;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1A0A2E" />
          <Stop offset="0.5" stopColor="#2D1B4E" />
          <Stop offset="1" stopColor="#0F0620" />
        </LinearGradient>
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E8D48B" />
          <Stop offset="0.5" stopColor="#C9A84C" />
          <Stop offset="1" stopColor="#8B6914" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} rx={8} fill="url(#logoBg)" />
      {/* Decorative corner elements */}
      <Path d={`M8 25 L8 8 L25 8`} fill="none" stroke="#C9A84C" strokeWidth={1.5} opacity={0.8} />
      <Path d={`M${width - 8} ${height - 25} L${width - 8} ${height - 8} L${width - 25} ${height - 8}`} fill="none" stroke="#C9A84C" strokeWidth={1.5} opacity={0.8} />
      <Path d={`M${width - 25} 8 L${width - 8} 8 L${width - 8} 25`} fill="none" stroke="#C9A84C" strokeWidth={1.5} opacity={0.8} />
      <Path d={`M25 ${height - 8} L8 ${height - 8} L8 ${height - 25}`} fill="none" stroke="#C9A84C" strokeWidth={1.5} opacity={0.8} />
      {/* Central circle */}
      <Circle cx={cx} cy={cy} r={Math.min(width, height) * 0.22} fill="none" stroke="url(#goldGrad)" strokeWidth={2} />
      {/* S letter */}
      <SvgText
        x={cx}
        y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="bold"
        fill="url(#goldGrad)"
      >
        S
      </SvgText>
      {/* Outer border */}
      <Rect x="3" y="3" width={width - 6} height={height - 6} rx={7} fill="none" stroke="#C9A84C" strokeWidth={1} opacity={0.6} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Design 5: Classic Checkerboard (red/white)
// ---------------------------------------------------------------------------

const CheckerboardDesign: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const cellSize = 12;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <Pattern id="checker" x="0" y="0" width={cellSize * 2} height={cellSize * 2} patternUnits="userSpaceOnUse">
          <Rect x="0" y="0" width={cellSize * 2} height={cellSize * 2} fill="#F5F0E8" />
          <Rect x="0" y="0" width={cellSize} height={cellSize} fill="#B22222" />
          <Rect x={cellSize} y={cellSize} width={cellSize} height={cellSize} fill="#B22222" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} rx={8} fill="#8B0000" />
      <Rect x="6" y="6" width={width - 12} height={height - 12} rx={4} fill="url(#checker)" />
      {/* Red border with white accent */}
      <Rect x="4" y="4" width={width - 8} height={height - 8} rx={6} fill="none" stroke="#F5F0E8" strokeWidth={1.5} />
      <Rect x="2" y="2" width={width - 4} height={height - 4} rx={7} fill="none" stroke="#8B0000" strokeWidth={1} />
    </Svg>
  );
};

// ---------------------------------------------------------------------------
// Exported component
// ---------------------------------------------------------------------------

export const CardBack: React.FC<CardBackProps> = ({ design, width, height }) => {
  switch (design) {
    case 1:
      return <ZelligeDesign width={width} height={height} />;
    case 2:
      return <ArabesqueDesign width={width} height={height} />;
    case 3:
      return <AzulejoDesign width={width} height={height} />;
    case 4:
      return <LogoDesign width={width} height={height} />;
    case 5:
      return <CheckerboardDesign width={width} height={height} />;
    default:
      return <LogoDesign width={width} height={height} />;
  }
};
