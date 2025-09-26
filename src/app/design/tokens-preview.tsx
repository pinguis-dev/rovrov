import { LinearGradient } from 'expo-linear-gradient';
import { type ReactElement, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesignTokens } from '@/design/design-system';
import {
  renderBorderToken,
  renderMotionToken,
  renderTokenValue,
} from '@/design/render-token-value';
import { type ColorTokenName, type MotionToken, type TypographyTokenName } from '@/design/tokens';

const AnimatedCard = Animated.createAnimatedComponent(View);
const AnimatedMicroDot = Animated.createAnimatedComponent(View);

function useMotionTiming(token: MotionToken) {
  return useMemo(() => {
    if (!('duration' in token)) {
      return undefined;
    }

    const easing = token.easing ? Easing.bezier(...token.easing) : undefined;

    return {
      duration: token.duration,
      easing,
    } as const;
  }, [token]);
}

function getTypographyStyle(
  tokenName: TypographyTokenName,
  tokens: ReturnType<typeof useDesignTokens>,
) {
  const token = tokens.typography[tokenName];
  const colorValue = tokens.colors[token.color];

  return {
    fontFamily: token.fontFamily,
    fontFamilyFallback: token.fontFamilyFallback,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    fontWeight: token.fontWeight,
    letterSpacing: token.letterSpacing,
    color: colorValue,
  } as const;
}

export default function TokensPreviewScreen(): ReactElement {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();
  const cardReveal = useSharedValue(0);
  const microPulse = useSharedValue(1);

  const contentMotion = tokens.motion['motion-content'];
  const microMotion = tokens.motion['motion-micro'];
  const contentTiming = useMotionTiming(contentMotion);
  const microTiming = useMotionTiming(microMotion);

  useEffect(() => {
    if (contentTiming) {
      cardReveal.value = withTiming(1, {
        duration: contentTiming.duration,
        easing: contentTiming.easing,
      });
    } else {
      cardReveal.value = withTiming(1);
    }

    if (microTiming) {
      microPulse.value = withRepeat(
        withSequence(
          withTiming(1.06, {
            duration: microTiming.duration,
            easing: microTiming.easing,
          }),
          withTiming(1, {
            duration: microTiming.duration,
            easing: microTiming.easing,
          }),
        ),
        -1,
        true,
      );
    }
  }, [cardReveal, contentTiming, microPulse, microTiming]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardReveal.value,
    transform: [
      {
        translateY: (1 - cardReveal.value) * 32,
      },
    ],
  }));

  const microDotStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: microPulse.value,
      },
    ],
  }));

  const border = tokens.borders['border-0.3'];
  const shadow = tokens.shadows['shadow-soft'];

  const colorKeys = [
    'color-text-title',
    'color-text-body',
    'color-text-foot',
    'color-accent-primary',
    'color-accent-muted',
    'color-surface-base',
    'color-surface-glass',
    'color-surface-elevated',
    'color-border-hairline',
  ] as const satisfies readonly ColorTokenName[];

  const colorEntries: Array<[ColorTokenName, string]> = colorKeys.map((name) => [
    name,
    tokens.colors[name],
  ]);

  const spacingKeys = [
    'space-4',
    'space-8',
    'space-16',
    'space-24',
    'space-32',
  ] as const satisfies readonly (keyof typeof tokens.spacing)[];

  const spacingEntries: Array<[(typeof spacingKeys)[number], number]> = spacingKeys.map((name) => [
    name,
    tokens.spacing[name],
  ]);

  return (
    <LinearGradient
      colors={['rgba(202, 224, 255, 0.45)', 'rgba(255, 255, 255, 0.96)']}
      locations={[0, 1]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + tokens.spacing['space-32'],
            paddingBottom: tokens.spacing['space-32'],
            paddingHorizontal: tokens.spacing['space-24'],
            gap: tokens.spacing['space-24'],
          },
        ]}
      >
        <AnimatedCard
          style={[
            styles.previewCard,
            cardStyle,
            {
              backgroundColor: tokens.colors['color-surface-glass'],
              borderColor: tokens.colors[border.color],
              borderWidth: border.width,
              padding: tokens.spacing['space-24'],
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              elevation: shadow.elevation,
            },
          ]}
        >
          <Text style={[styles.hero, getTypographyStyle('typo-hero', tokens)]}>小さな冒険を、</Text>
          <Text style={[styles.display, getTypographyStyle('typo-display', tokens)]}>
            透明感のある UI で残そう
          </Text>
          <Text style={[styles.body, getTypographyStyle('typo-body', tokens)]}>
            Rovrov のデザイントークンは、ミニマルで未来的な体験を実装するための
            共通言語です。タイポ、カラー、余白、モーションすべてをこのカードで確認できます。
          </Text>
          <Text style={[styles.footnote, getTypographyStyle('typo-footnote', tokens)]}>
            motion-content を使用して、このカード全体が穏やかにフェードインしています。
          </Text>
          <View style={styles.motionRow}>
            <Text style={[styles.body, getTypographyStyle('typo-body', tokens)]}>
              motion-micro サンプル
            </Text>
            <AnimatedMicroDot
              style={[
                styles.microDot,
                microDotStyle,
                {
                  backgroundColor: tokens.colors['color-accent-primary'],
                },
              ]}
            />
          </View>
        </AnimatedCard>

        <View
          style={[
            styles.section,
            {
              padding: tokens.spacing['space-24'],
              gap: tokens.spacing['space-12'],
              borderWidth: border.width,
              borderColor: tokens.colors['color-border-hairline'],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, getTypographyStyle('typo-title', tokens)]}>
            Colors
          </Text>
          {colorEntries.map(([name, value]) => (
            <View key={name} style={[styles.row, { gap: tokens.spacing['space-12'] }]}>
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: value,
                    borderColor: name.includes('surface')
                      ? tokens.colors[border.color]
                      : 'transparent',
                    borderWidth: name.includes('surface') ? border.width : 0,
                  },
                ]}
              />
              <Text style={[styles.rowLabel, getTypographyStyle('typo-body', tokens)]}>{name}</Text>
              <Text
                selectable
                style={[styles.rowValue, getTypographyStyle('typo-footnote', tokens)]}
              >
                {renderTokenValue(value)}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.section,
            {
              padding: tokens.spacing['space-24'],
              gap: tokens.spacing['space-12'],
              borderWidth: border.width,
              borderColor: tokens.colors['color-border-hairline'],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, getTypographyStyle('typo-title', tokens)]}>
            Spacing
          </Text>
          {spacingEntries.map(([name, value]) => (
            <View key={name} style={[styles.row, { gap: tokens.spacing['space-12'] }]}>
              <View style={styles.spacingBarContainer}>
                <View
                  style={[
                    styles.spacingBar,
                    {
                      width: value,
                      backgroundColor: tokens.colors['color-accent-muted'],
                    },
                  ]}
                />
              </View>
              <Text style={[styles.rowLabel, getTypographyStyle('typo-body', tokens)]}>{name}</Text>
              <Text
                selectable
                style={[styles.rowValue, getTypographyStyle('typo-footnote', tokens)]}
              >
                {renderTokenValue(value)}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.section,
            {
              padding: tokens.spacing['space-24'],
              gap: tokens.spacing['space-12'],
              borderWidth: border.width,
              borderColor: tokens.colors['color-border-hairline'],
            },
          ]}
        >
          <Text style={[styles.sectionTitle, getTypographyStyle('typo-title', tokens)]}>
            Motion & Surface
          </Text>
          <Text selectable style={[styles.rowValue, getTypographyStyle('typo-footnote', tokens)]}>
            {renderMotionToken(contentMotion, 'motion-content')}
          </Text>
          <Text selectable style={[styles.rowValue, getTypographyStyle('typo-footnote', tokens)]}>
            {renderMotionToken(microMotion, 'motion-micro')}
          </Text>
          <Text selectable style={[styles.rowValue, getTypographyStyle('typo-footnote', tokens)]}>
            {renderBorderToken(border, 'border-0.3', tokens.colors)}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  previewCard: {
    borderRadius: 28,
    gap: 12,
  },
  hero: {
    marginBottom: 4,
  },
  display: {
    marginBottom: 16,
  },
  body: {
    marginBottom: 8,
  },
  footnote: {
    marginBottom: 16,
    opacity: 0.85,
  },
  motionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  microDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  section: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.64)',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  spacingBarContainer: {
    width: 48,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    overflow: 'hidden',
  },
  spacingBar: {
    height: '100%',
    borderRadius: 4,
  },
});
