import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDesignTokens } from '@/design/design-system';
import type { TypographyTokenName } from '@/design/tokens';

const timelineCards = [
  {
    id: 'post-1',
    title: 'Morning Drip at the Riverside',
    location: 'Nakameguro, Tokyo',
    caption:
      'Sipped a light roast while the sun slipped through the cherry tree canopy. Added a quick sketch of the view to remember the warmth.',
    tags: ['coffee', 'sketching'],
  },
  {
    id: 'post-2',
    title: 'Hidden Alley Sound Check',
    location: 'Koenji, Tokyo',
    caption:
      'Street musician let me try the synth patch before the crowd gathered. Saved a short clip to remix later tonight.',
    tags: ['music', 'nightlife'],
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

export default function TimelineScreen() {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();

  const surfaceBorder = tokens.borders['border-0.3'];
  const cardShadow = tokens.shadows['shadow-soft'];

  return (
    <LinearGradient
      colors={['rgba(202, 224, 255, 0.45)', tokens.colors['color-surface-base']]}
      locations={[0, 1]}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + tokens.spacing['space-32'],
          paddingBottom: tokens.spacing['space-32'],
          paddingHorizontal: tokens.spacing['space-24'],
          gap: tokens.spacing['space-24'],
        }}
      >
        <View style={{ gap: tokens.spacing['space-8'] }}>
          <Text style={getTypographyStyle(tokens, 'typo-hero')}>今日のハイライト</Text>
          <Text style={getTypographyStyle(tokens, 'typo-body')}>
            タイムラインで最近の“小さな冒険”を振り返り、次の出かけ先のヒントを見つけましょう。
          </Text>
        </View>

        {timelineCards.map((card) => (
          <View
            key={card.id}
            style={{
              backgroundColor: tokens.colors['color-surface-glass'],
              borderRadius: 28,
              borderWidth: surfaceBorder.width,
              borderColor: tokens.colors[surfaceBorder.color],
              padding: tokens.spacing['space-24'],
              gap: tokens.spacing['space-12'],
              shadowColor: cardShadow.color,
              shadowOffset: cardShadow.offset,
              shadowOpacity: cardShadow.opacity,
              shadowRadius: cardShadow.radius,
              elevation: cardShadow.elevation,
            }}
          >
            <View style={{ gap: tokens.spacing['space-4'] }}>
              <Text style={getTypographyStyle(tokens, 'typo-title')}>{card.title}</Text>
              <Text
                style={{
                  ...getTypographyStyle(tokens, 'typo-footnote'),
                  color: tokens.colors['color-text-foot'],
                }}
              >
                {card.location}
              </Text>
            </View>
            <Text style={getTypographyStyle(tokens, 'typo-body')}>{card.caption}</Text>
            <View
              style={{ flexDirection: 'row', gap: tokens.spacing['space-8'], flexWrap: 'wrap' }}
            >
              {card.tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    backgroundColor: tokens.colors['color-surface-elevated'],
                    borderRadius: 999,
                    paddingHorizontal: tokens.spacing['space-12'],
                    paddingVertical: tokens.spacing['space-4'],
                    borderWidth: surfaceBorder.width,
                    borderColor: tokens.colors[surfaceBorder.color],
                  }}
                >
                  <Text
                    style={{
                      ...getTypographyStyle(tokens, 'typo-footnote'),
                      color: tokens.colors['color-accent-primary'],
                    }}
                  >
                    #{tag}
                  </Text>
                </View>
              ))}
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
