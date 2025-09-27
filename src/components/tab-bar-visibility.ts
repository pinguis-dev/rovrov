import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Animated, Easing, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

const visibilityValue = new Animated.Value(0);
let currentState: 'shown' | 'hidden' = 'shown';
let activeAnimation: Animated.CompositeAnimation | null = null;

const easing = Easing.bezier(0.2, 0, 0.2, 1);
const duration = 340;
const animationDelay = 260;

function runAnimation(target: 0 | 1) {
  const nextState: 'shown' | 'hidden' = target === 0 ? 'shown' : 'hidden';
  if (currentState === nextState) {
    return;
  }

  activeAnimation?.stop();
  activeAnimation = Animated.timing(visibilityValue, {
    toValue: target,
    duration,
    easing,
    delay: animationDelay,
    useNativeDriver: true,
  });
  currentState = nextState;
  activeAnimation.start(() => {
    activeAnimation = null;
  });
}

export function hideTabBar() {
  runAnimation(1);
}

export function showTabBar() {
  runAnimation(0);
}

export function useTabBarVisibilityValue() {
  return visibilityValue;
}

type ScrollEventHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

export function useBottomTabBarAutoHide(onExternalScroll?: ScrollEventHandler): ScrollEventHandler {
  const lastOffsetY = useRef(0);

  const handleScroll = useCallback<ScrollEventHandler>(
    (event) => {
      onExternalScroll?.(event);

      const offsetY = event.nativeEvent.contentOffset.y;
      const delta = offsetY - lastOffsetY.current;
      lastOffsetY.current = offsetY;

      if (offsetY <= 0 || delta < -6) {
        showTabBar();
        return;
      }

      if (delta > 6) {
        hideTabBar();
      }
    },
    [onExternalScroll],
  );

  useFocusEffect(
    useCallback(() => {
      showTabBar();
      return () => {
        showTabBar();
      };
    }, []),
  );

  return handleScroll;
}
