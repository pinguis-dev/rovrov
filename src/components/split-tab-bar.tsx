import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
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

function parseColorToRgb(color: string): [number, number, number] | null {
  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return [r, g, b];
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b];
  }

  const rgbaMatch = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbaMatch) {
    const parts = rgbaMatch[1]
      .split(',')
      .map((part) => parseFloat(part.trim()))
      .filter((value, index) => index < 3 && Number.isFinite(value));
    if (parts.length === 3) {
      return parts as [number, number, number];
    }
  }

  return null;
}

function getRelativeLuminance(color: string): number {
  const rgb = parseColorToRgb(color);
  if (!rgb) {
    return 1;
  }

  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  }) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function SplitTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();
  const visibility = useTabBarVisibilityValue();

  const shadow = tokens.shadows['shadow-soft'];

  const horizontalPadding = tokens.spacing['space-24'];
  const outerGap = tokens.spacing['space-16'];
  const innerGap = 0;
  const actionHeight = 60;
  const baseBottomOffset = tokens.spacing['space-8'];
  const bottomOffset = insets.bottom > 0 ? 0 : baseBottomOffset;
  const bottomPadding = insets.bottom + bottomOffset;
  const hideDistance = bottomPadding + actionHeight + baseBottomOffset;
  const surfaceBaseColor = tokens.colors['color-surface-base'];
  const surfaceLuminance = getRelativeLuminance(surfaceBaseColor);
  const overlayColor = 'rgba(240, 230, 210, 0.22)';
  const blurTint = 'light';
  const iconHighlightColor = 'rgba(255, 255, 255, 0.18)';
  const tabBarBlurIntensity = 22;
  const ctaBlurIntensity = 25;
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
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity * 0.45,
              shadowRadius: shadow.radius * 0.7,
              elevation: Math.max(1, Math.round(shadow.elevation * 0.6)),
              height: actionHeight,
              borderRadius: actionHeight / 2,
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.4)',
            },
          ]}
        >
          <BlurView
            intensity={tabBarBlurIntensity}
            tint={blurTint}
            style={[styles.blurBackground, { borderRadius: actionHeight }]}
          />
          <View
            pointerEvents="none"
            style={[styles.blurOverlay, { borderRadius: actionHeight, backgroundColor: overlayColor }]}
          />
          <View style={[styles.tabContent, { paddingHorizontal: tokens.spacing['space-4'] }]}>
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
                color: tokens.colors['color-text-title'],
                size: 36,
              });

              const inactiveIconElement = options.tabBarIcon?.({
                focused: false,
                color: tokens.colors['color-icon-default'],
                size: 36,
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
                      borderRadius: actionHeight / 2,
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
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity * 0.45,
              shadowRadius: shadow.radius * 0.7,
              elevation: Math.max(1, Math.round(shadow.elevation * 0.6)),
              opacity: pressed ? 0.86 : 1,
              height: actionHeight,
              width: actionHeight,
              borderRadius: actionHeight / 2,
              overflow: 'hidden',
            },
          ]}
        >
          <BlurView
            intensity={ctaBlurIntensity}
            tint={blurTint}
            style={[styles.blurBackground, { borderRadius: actionHeight / 2 }]}
          />
          <View
            pointerEvents="none"
            style={[styles.blurOverlay, { borderRadius: actionHeight / 2, backgroundColor: overlayColor }]}
          />
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
    overflow: 'hidden',
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    height: '100%',
  },
  iconPill: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHighlight: {
    ...StyleSheet.absoluteFillObject,
  },
  iconStack: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
