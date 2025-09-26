import type {
  BorderTokenName,
  ColorTokenName,
  MotionToken,
  MotionTokenName,
  MotionTimingToken,
  ShadowToken,
  ShadowTokenName,
} from './tokens';

function isMotionTimingToken(token: MotionToken): token is MotionTimingToken {
  return 'duration' in token;
}

function isShadowToken(value: unknown): value is ShadowToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    'offset' in value &&
    'radius' in value &&
    'opacity' in value &&
    'elevation' in value
  );
}

type RenderOptions = {
  colors?: Partial<Record<ColorTokenName, string>>;
};

export function renderTokenValue(
  value: number | string | MotionToken | { width: number; color: ColorTokenName } | ShadowToken,
  options: RenderOptions = {},
): string {
  if (typeof value === 'number') {
    return `${value}px`;
  }

  if (typeof value === 'string') {
    return value;
  }

  if ('width' in value && 'color' in value) {
    const colorValue = options.colors?.[value.color] ?? value.color;
    return `${value.width}px / ${colorValue}`;
  }

  if (isShadowToken(value)) {
    const { offset, radius, opacity, elevation, color } = value;
    return `offset(${offset.width},${offset.height}) • radius ${radius}px • opacity ${opacity} • elevation ${elevation} • ${color}`;
  }

  if (isMotionTimingToken(value)) {
    const easing = value.easing
      ? `cubic-bezier(${value.easing.map((point) => Number(point.toFixed(2))).join(', ')})`
      : 'linear';
    const delay = value.delay ? ` • delay ${value.delay}ms` : '';
    return `${value.duration}ms • ${easing}${delay}`;
  }

  if (value.type === 'spring') {
    return `spring(mass: ${value.mass}, stiffness: ${value.stiffness}, damping: ${value.damping})`;
  }

  return String(value);
}

export function renderMotionToken(token: MotionToken, tokenName: MotionTokenName): string {
  return `${tokenName}: ${renderTokenValue(token)}`;
}

export function renderBorderToken(
  border: { width: number; color: ColorTokenName },
  borderName: BorderTokenName,
  colors?: Partial<Record<ColorTokenName, string>>,
): string {
  const formatted = renderTokenValue(border, { colors });
  return `${borderName}: ${formatted}`;
}

export function renderShadowToken(shadow: ShadowToken, shadowName: ShadowTokenName): string {
  return `${shadowName}: ${renderTokenValue(shadow)}`;
}
