import RemixIcon from 'react-native-remix-icon';

export const TAB_ICON_SIZE = 28;

export const tabIconGlyphs = {
  timeline: {
    line: 'layout-2-line',
    fill: 'layout-2-fill',
  },
  map: {
    line: 'map-line',
    fill: 'map-fill',
  },
  notifications: {
    line: 'notification-4-line',
    fill: 'notification-4-fill',
  },
  account: {
    line: 'account-pin-circle-line',
    fill: 'account-pin-circle-fill',
  },
  post: {
    line: 'add-line',
    fill: 'add-line',
  },
} as const;

export type TabIconKey = keyof typeof tabIconGlyphs;

export function TabIcon({
  icon,
  focused,
  color,
  size = TAB_ICON_SIZE,
}: {
  icon: Exclude<TabIconKey, 'post'>;
  focused: boolean;
  color: string;
  size?: number;
}) {
  const glyph = tabIconGlyphs[icon][focused ? 'fill' : 'line'];

  return <RemixIcon name={glyph} size={size} color={color} />;
}

export function PostIcon({ color, size = TAB_ICON_SIZE }: { color: string; size?: number }) {
  const glyph = tabIconGlyphs.post.line;
  return <RemixIcon name={glyph} size={size} color={color} />;
}
