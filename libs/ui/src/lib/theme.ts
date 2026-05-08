/**
 * SallyCards design system tokens and theme definitions.
 */

export const colors = {
  primary: '#1E3A5F',
  accent: '#C9A84C',
  success: '#2E7D52',
  error: '#C62828',
  surface: '#F8F5F0',
  background: '#0A1929',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
} as const;

export const spacing = {
  s4: 4,
  s8: 8,
  s12: 12,
  s16: 16,
  s24: 24,
  s32: 32,
  s48: 48,
  s64: 64,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  heading: 24,
  subheading: 20,
  body: 16,
  caption: 14,
  cardValue: 18,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardLifted: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  cardPressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
} as const;

export interface Theme {
  colors: {
    primary: string;
    accent: string;
    success: string;
    error: string;
    surface: string;
    background: string;
    text: string;
    textSecondary: string;
  };
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
}

export const darkTheme: Theme = {
  colors: {
    primary: '#1E3A5F',
    accent: '#C9A84C',
    success: '#2E7D52',
    error: '#C62828',
    surface: '#142638',
    background: '#0A1929',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
  },
  spacing,
  borderRadius,
  typography,
  shadows,
};

export const lightTheme: Theme = {
  colors: {
    primary: '#2C5282',
    accent: '#D4AF37',
    success: '#38A169',
    error: '#E53E3E',
    surface: '#F8F5F0',
    background: '#FFFFFF',
    text: '#1A202C',
    textSecondary: '#718096',
  },
  spacing,
  borderRadius,
  typography,
  shadows,
};
