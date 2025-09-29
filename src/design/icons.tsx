import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';

export const TAB_ICON_SIZE = 26;

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const iconNameMap: Record<'tl' | 'map' | 'notifications' | 'account', IoniconName> = {
  tl: 'grid',
  map: 'map',
  notifications: 'notifications',
  account: 'person-circle-sharp',
};

const ICON_COLOR = '#262626';

export type TabIconKey = keyof typeof iconNameMap;

export function TabIcon({
  icon,
  focused: _focused,
  color: _color,
  size = TAB_ICON_SIZE,
}: {
  icon: TabIconKey;
  focused: boolean;
  color: string;
  size?: number;
}) {
  const effectiveSize = icon === 'account' ? (size ?? TAB_ICON_SIZE) + 2 : size ?? TAB_ICON_SIZE;

  return <Ionicons name={iconNameMap[icon]} size={effectiveSize} color={ICON_COLOR} />;
}

export function PostIcon({ color, size = TAB_ICON_SIZE }: { color: string; size?: number }) {
  return <Ionicons name="add-sharp" size={size} color={color} />;
}
