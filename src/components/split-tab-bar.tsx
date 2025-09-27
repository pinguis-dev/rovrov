import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTabBarVisibilityValue } from '@/components/tab-bar-visibility';
import { useDesignTokens } from '@/design/design-system';
import { PostIcon } from '@/design/icons';

const LEFT_ROUTE_ORDER = ['index', 'map', 'notifications', 'account'] as const;
const POST_ROUTE = '/modal';

export function SplitTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();
  const visibility = useTabBarVisibilityValue();

  const border = tokens.borders['border-0.3'];
  const shadow = tokens.shadows['shadow-soft'];

  const horizontalPadding = tokens.spacing['space-24'];
  const outerGap = tokens.spacing['space-16'];
  const innerGap = tokens.spacing['space-12'];
  const actionHeight = 56;
  const baseBottomOffset = tokens.spacing['space-8'];
  const bottomOffset = insets.bottom > 0 ? 0 : baseBottomOffset;
  const bottomPadding = insets.bottom + bottomOffset;
  const hideDistance = bottomPadding + actionHeight + baseBottomOffset;

  const translateY = useMemo(
    () =>
      visibility.interpolate({
        inputRange: [0, 1],
        outputRange: [0, hideDistance],
      }),
    [hideDistance],
  );

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        paddingBottom: bottomPadding,
        paddingHorizontal: horizontalPadding,
        height: actionHeight + bottomPadding,
      },
    ],
    [actionHeight, bottomPadding, horizontalPadding],
  );

  const leftRoutes = LEFT_ROUTE_ORDER.map((routeName) =>
    state.routes.find((route) => route.name === routeName),
  ).filter((route): route is (typeof state.routes)[number] => Boolean(route));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[containerStyle, { transform: [{ translateY }] }]}
    >
      <View style={[styles.innerWrapper, { gap: outerGap, height: actionHeight }]}>
        <View
          style={[
            styles.tabGroup,
            {
              backgroundColor: tokens.colors['color-surface-glass'],
              borderColor: tokens.colors[border.color],
              borderWidth: border.width,
              paddingHorizontal: tokens.spacing['space-12'],
              gap: innerGap,
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              elevation: shadow.elevation,
              height: actionHeight,
              borderRadius: actionHeight / 2,
              alignItems: 'center',
            },
          ]}
        >
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

            const icon = options.tabBarIcon?.({
              focused: isFocused,
              color: iconColor,
              size: 22,
            });

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? labelText}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tabButton,
                  {
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View>{icon}</View>
              </Pressable>
            );
          })}
        </View>

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
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              elevation: shadow.elevation,
              opacity: pressed ? 0.86 : 1,
              height: actionHeight,
              width: actionHeight,
              borderRadius: actionHeight / 2,
            },
          ]}
        >
          <PostIcon color={tokens.colors['color-accent-primary']} size={32} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  innerWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 56,
    height: '100%',
  },
  postButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
