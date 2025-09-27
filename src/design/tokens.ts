export type TypographyToken = {
  fontFamily: string;
  fontFamilyFallback?: string[];
  fontSize: number;
  lineHeight: number;
  fontWeight: '200' | '300' | '400';
  letterSpacing?: number;
  color: ColorTokenName;
};

export type TypographyTokenName =
  | 'typo-hero'
  | 'typo-display'
  | 'typo-title'
  | 'typo-body'
  | 'typo-footnote';

export type ColorTokenName =
  | 'color-text-title'
  | 'color-text-body'
  | 'color-text-foot'
  | 'color-accent-primary'
  | 'color-accent-muted'
  | 'color-icon-default'
  | 'color-icon-active'
  | 'color-surface-base'
  | 'color-surface-glass'
  | 'color-surface-elevated'
  | 'color-border-hairline';

export type MotionTokenName = 'motion-tap' | 'motion-micro' | 'motion-content' | 'motion-hero';

export type MotionBezier = [number, number, number, number];

export type MotionTimingToken = {
  duration: number;
  easing: MotionBezier;
  delay?: number;
};

export type MotionSpringToken = {
  type: 'spring';
  mass: number;
  stiffness: number;
  damping: number;
};

export type MotionToken = MotionTimingToken | MotionSpringToken;

export type BorderTokenName = 'border-0.3';

export type ShadowTokenName = 'shadow-soft';

export type ShadowToken = {
  color: string;
  offset: { width: number; height: number };
  radius: number;
  opacity: number;
  elevation: number;
};

export const fontReferences = {
  inter: {
    ultraLight: 'Inter_200ExtraLight',
    light: 'Inter_300Light',
    regular: 'Inter_400Regular',
  },
  notoSansJp: {
    light: 'NotoSansJP_300Light',
    regular: 'NotoSansJP_400Regular',
  },
} as const;

export const typography: Record<TypographyTokenName, TypographyToken> = {
  'typo-hero': {
    fontFamily: fontReferences.inter.ultraLight,
    fontFamilyFallback: [fontReferences.notoSansJp.light],
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '200',
    letterSpacing: -0.5,
    color: 'color-text-title',
  },
  'typo-display': {
    fontFamily: fontReferences.inter.ultraLight,
    fontFamilyFallback: [fontReferences.notoSansJp.light],
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '200',
    letterSpacing: -0.5,
    color: 'color-text-title',
  },
  'typo-title': {
    fontFamily: fontReferences.inter.light,
    fontFamilyFallback: [fontReferences.notoSansJp.light],
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '300',
    letterSpacing: -0.25,
    color: 'color-text-title',
  },
  'typo-body': {
    fontFamily: fontReferences.inter.regular,
    fontFamilyFallback: [fontReferences.notoSansJp.regular],
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'color-text-body',
  },
  'typo-footnote': {
    fontFamily: fontReferences.inter.light,
    fontFamilyFallback: [fontReferences.notoSansJp.light],
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '300',
    letterSpacing: 0,
    color: 'color-text-foot',
  },
};

export const colors: Record<ColorTokenName, string> = {
  'color-text-title': '#3A3A3A',
  'color-text-body': '#666666',
  'color-text-foot': 'rgba(138, 145, 152, 0.7)',
  'color-accent-primary': '#0D55FF',
  'color-accent-muted': '#9DB4FF',
  'color-icon-default': 'rgba(138, 145, 152, 0.7)',
  'color-icon-active': '#3A3A3A',
  'color-surface-base': 'rgba(248, 250, 255, 0.96)',
  'color-surface-glass': 'rgba(255, 255, 255, 0.72)',
  'color-surface-elevated': 'rgba(255, 255, 255, 0.84)',
  'color-border-hairline': 'rgba(15, 23, 42, 0.18)',
};

export const spacing = {
  'space-4': 4,
  'space-8': 8,
  'space-12': 12,
  'space-16': 16,
  'space-24': 24,
  'space-32': 32,
  'space-40': 40,
  'space-48': 48,
  'space-56': 56,
  'space-64': 64,
} as const;

export const borders: Record<BorderTokenName, { width: number; color: ColorTokenName }> = {
  'border-0.3': {
    width: 0.3,
    color: 'color-border-hairline',
  },
};

export const shadows: Record<ShadowTokenName, ShadowToken> = {
  'shadow-soft': {
    color: 'rgba(15, 23, 42, 0.18)',
    offset: { width: 0, height: 12 },
    radius: 24,
    opacity: 0.18,
    elevation: 20,
  },
};

export type MotionTokens = Record<MotionTokenName, MotionToken>;

export const motion: MotionTokens = {
  'motion-tap': {
    duration: 80,
    easing: [0.2, 0, 0.38, 0.9],
  },
  'motion-micro': {
    duration: 160,
    easing: [0.2, 0, 0.38, 0.9],
  },
  'motion-content': {
    duration: 260,
    easing: [0, 0, 0.2, 1],
  },
  'motion-hero': {
    type: 'spring',
    mass: 1,
    stiffness: 180,
    damping: 24,
  },
};

export const designTokens = {
  typography,
  colors,
  spacing,
  borders,
  shadows,
  motion,
} as const;

export type DesignTokens = typeof designTokens;
