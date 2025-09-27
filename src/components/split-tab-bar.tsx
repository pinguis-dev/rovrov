import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
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

  const shadow = tokens.shadows['shadow-soft'];

  const horizontalPadding = tokens.spacing['space-24'];
  const outerGap = tokens.spacing['space-16'];
  const innerGap = 0;
  const actionHeight = 56;
  const baseBottomOffset = tokens.spacing['space-8'];
  const bottomOffset = insets.bottom > 0 ? 0 : baseBottomOffset;
  const bottomPadding = insets.bottom + bottomOffset;
  const hideDistance = bottomPadding + actionHeight + baseBottomOffset;
  const iconHighlightColor = 'rgba(58, 58, 58, 0.08)';
  const highlightValuesRef = useRef<Record<string, Animated.Value>>({});
  const highlightStateRef = useRef<Record<string, boolean>>({});

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
              paddingHorizontal: tokens.spacing['space-16'],
              gap: innerGap,
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              elevation: shadow.elevation,
              height: actionHeight,
              borderRadius: actionHeight,
              alignItems: 'center',
            },
          ]}
        >
          {leftRoutes.map((route) => {
            const routeIndex = state.routes.findIndex((item) => item.key === route.key);
            const isFocused = state.index === routeIndex;
            const { options } = descriptors[route.key];
            const storedHighlight = highlightValuesRef.current[route.key];
            const highlightValue =
              storedHighlight ?? new Animated.Value(isFocused ? 1 : 0);

            if (!storedHighlight) {
              highlightValuesRef.current[route.key] = highlightValue;
              highlightStateRef.current[route.key] = isFocused;
            } else if (highlightStateRef.current[route.key] !== isFocused) {
              highlightStateRef.current[route.key] = isFocused;
              Animated.timing(highlightValue, {
                toValue: isFocused ? 1 : 0,
                duration: 320,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start();
            }

            const defaultLabel = route.name.charAt(0).toUpperCase() + route.name.slice(1);
            const rawLabel = options.tabBarLabel ?? options.title ?? defaultLabel;
            const labelText = typeof rawLabel === 'string' ? rawLabel : defaultLabel;

            const activeIconElement = options.tabBarIcon?.({
              focused: true,
              color: tokens.colors['color-icon-active'],
              size: 22,
            });

            const inactiveIconElement = options.tabBarIcon?.({
              focused: false,
              color: tokens.colors['color-icon-default'],
              size: 22,
            });

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
                <View
                  style={[
                    styles.iconPill,
                    {
                      paddingHorizontal: tokens.spacing['space-16'],
                      paddingVertical: tokens.spacing['space-8'],
                      borderRadius: actionHeight,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.iconHighlight,
                      {
                        borderRadius: actionHeight,
                        backgroundColor: iconHighlightColor,
                        opacity: highlightValue,
                      },
                    ]}
                  />
                  <View style={styles.iconStack}>
                    {inactiveIconElement ? (
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          position: 'absolute',
                          opacity: highlightValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0],
                          }),
                        }}
                      >
                        {inactiveIconElement}
                      </Animated.View>
                    ) : null}
                    {activeIconElement ? (
                      <Animated.View pointerEvents="none" style={{ opacity: highlightValue }}>
                        {activeIconElement}
                      </Animated.View>
                    ) : inactiveIconElement}
                  </View>
                </View>
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
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  tabGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  iconPill: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
  iconStack: {
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});
