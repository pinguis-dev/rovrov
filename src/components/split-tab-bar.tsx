import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesignTokens } from '@/design/design-system';
import { PostIcon } from '@/design/icons';

const LEFT_ROUTE_ORDER = ['index', 'map', 'notifications', 'account'] as const;
const POST_ROUTE = '/modal';

export function SplitTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();

  const border = tokens.borders['border-0.3'];
  const labelToken = tokens.typography['typo-footnote'];
  const shadow = tokens.shadows['shadow-soft'];

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: tokens.colors['color-surface-glass'],
        borderTopWidth: border.width,
        borderTopColor: tokens.colors[border.color],
        paddingHorizontal: tokens.spacing['space-24'],
        paddingTop: tokens.spacing['space-8'],
        paddingBottom: Math.max(insets.bottom, tokens.spacing['space-12']),
        shadowColor: shadow.color,
        shadowOffset: shadow.offset,
        shadowOpacity: shadow.opacity,
        shadowRadius: shadow.radius,
        elevation: shadow.elevation,
      },
    ],
    [
      border.color,
      border.width,
      insets.bottom,
      shadow.color,
      shadow.elevation,
      shadow.offset,
      shadow.opacity,
      shadow.radius,
      tokens,
    ],
  );

  const tabGap = tokens.spacing['space-16'];

  const leftRoutes = LEFT_ROUTE_ORDER.map((routeName) =>
    state.routes.find((route) => route.name === routeName),
  ).filter((route): route is (typeof state.routes)[number] => Boolean(route));

  return (
    <View style={containerStyle}>
      <View style={[styles.leftSection, { gap: tabGap }]}>
        {leftRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key];

          const defaultLabel = route.name.charAt(0).toUpperCase() + route.name.slice(1);
          const rawLabel = options.tabBarLabel ?? options.title ?? defaultLabel;
          const labelText = typeof rawLabel === 'string' ? rawLabel : defaultLabel;
          const iconColor = isFocused
            ? tokens.colors['color-icon-active']
            : tokens.colors['color-icon-default'];
          const textColor = isFocused
            ? tokens.colors['color-text-title']
            : tokens.colors['color-text-body'];

          const onPress = () => {
            if (isFocused) {
              return;
            }

            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
            }

            navigation.navigate(route.name);
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon = options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 28 });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tabButton,
                {
                  paddingVertical: tokens.spacing['space-4'],
                  gap: tokens.spacing['space-4'],
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View>{icon}</View>
              <Text
                style={{
                  fontFamily: labelToken.fontFamily,
                  fontSize: 12,
                  letterSpacing: labelToken.letterSpacing,
                  color: textColor,
                }}
              >
                {labelText}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a new post"
        onPress={() => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
          }
          router.push(POST_ROUTE);
        }}
        style={({ pressed }) => [
          styles.postButton,
          {
            backgroundColor: tokens.colors['color-surface-elevated'],
            borderColor: tokens.colors[border.color],
            borderWidth: border.width,
            paddingVertical: tokens.spacing['space-8'],
            paddingHorizontal: tokens.spacing['space-16'],
            gap: tokens.spacing['space-8'],
            opacity: pressed ? 0.86 : 1,
          },
        ]}
      >
        <PostIcon color={tokens.colors['color-accent-primary']} />
        <Text
          style={{
            fontFamily: labelToken.fontFamily,
            fontSize: 14,
            letterSpacing: labelToken.letterSpacing,
            color: tokens.colors['color-accent-primary'],
          }}
        >
          Post
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  tabButton: {
    alignItems: 'center',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
  },
});
