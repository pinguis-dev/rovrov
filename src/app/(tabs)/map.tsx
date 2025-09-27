import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomTabBarAutoHide } from '@/components/tab-bar-visibility';
import { useDesignTokens } from '@/design/design-system';
import type { TypographyTokenName } from '@/design/tokens';

const suggestedPins = [
  {
    id: 'pin-1',
    name: 'Seaside Espresso Stand',
    area: 'Enoshima, Kanagawa',
    distance: '38 min drive',
    note: 'Sunrise espresso with ocean breeze. Perfect for dawn photos.',
  },
  {
    id: 'pin-2',
    name: 'Rooftop Observatory Walk',
    area: 'Shibuya, Tokyo',
    distance: '18 min subway',
    note: 'Glass observatory with 270° view. Try visiting at twilight for soft light.',
  },
];

function getTypographyStyle(
  tokens: ReturnType<typeof useDesignTokens>,
  tokenName: TypographyTokenName,
) {
  const token = tokens.typography[tokenName];

  return {
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    letterSpacing: token.letterSpacing,
    lineHeight: token.lineHeight,
    color: tokens.colors[token.color],
  } as const;
}

export default function MapScreen() {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();
  const border = tokens.borders['border-0.3'];
  const handleScroll = useBottomTabBarAutoHide();

  return (
    <LinearGradient
      colors={[tokens.colors['color-surface-base'], 'rgba(255, 255, 255, 0.96)']}
      locations={[0, 1]}
      style={styles.gradient}
    >
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + tokens.spacing['space-32'],
          paddingBottom: tokens.spacing['space-32'],
          paddingHorizontal: tokens.spacing['space-24'],
          gap: tokens.spacing['space-24'],
        }}
      >
        <View style={{ gap: tokens.spacing['space-8'] }}>
          <Text style={getTypographyStyle(tokens, 'typo-display')}>マップで次の目的地を探す</Text>
          <Text style={getTypographyStyle(tokens, 'typo-body')}>
            位置情報つきの投稿と連動し、近くのおすすめスポットが自動で現れます。距離と所要時間で直感的に判断できます。
          </Text>
        </View>

        {suggestedPins.map((pin) => (
          <View
            key={pin.id}
            style={{
              backgroundColor: tokens.colors['color-surface-glass'],
              borderRadius: 24,
              borderWidth: border.width,
              borderColor: tokens.colors[border.color],
              padding: tokens.spacing['space-24'],
              gap: tokens.spacing['space-12'],
            }}
          >
            <View style={{ gap: tokens.spacing['space-4'] }}>
              <Text style={getTypographyStyle(tokens, 'typo-title')}>{pin.name}</Text>
              <Text
                style={{
                  ...getTypographyStyle(tokens, 'typo-footnote'),
                  color: tokens.colors['color-text-foot'],
                }}
              >
                {pin.area} ・ {pin.distance}
              </Text>
            </View>
            <Text style={getTypographyStyle(tokens, 'typo-body')}>{pin.note}</Text>
            <View
              style={{
                borderRadius: 18,
                borderWidth: border.width,
                borderColor: tokens.colors[border.color],
                paddingVertical: tokens.spacing['space-8'],
                paddingHorizontal: tokens.spacing['space-16'],
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  ...getTypographyStyle(tokens, 'typo-footnote'),
                  color: tokens.colors['color-accent-primary'],
                }}
              >
                View on Map
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
