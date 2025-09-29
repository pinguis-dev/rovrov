import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomTabBarAutoHide } from '@/components/tab-bar-visibility';
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

const cafeShots = [
  {
    id: 'cafe-1',
    title: 'Latte Art Workshop',
    location: 'Meguro, Tokyo',
    description: '午後の柔らかい光が差し込むカウンターで、バリスタが描いた最新のラテアート。',
    imageUrl:
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cafe-2',
    title: 'Morning Brew Corner',
    location: 'Daikanyama, Tokyo',
    description: 'オールドウッドのテーブルと手作りマグに映える浅煎りの香り。',
    imageUrl:
      'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cafe-3',
    title: 'Rooftop Espresso Bar',
    location: 'Shinjuku, Tokyo',
    description: '青いネオンが灯る夕暮れのテラスで、シティラインを眺めながらの一杯。',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
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
  const handleScroll = useBottomTabBarAutoHide();

  const surfaceBorder = tokens.borders['border-0.3'];
  const cardShadow = tokens.shadows['shadow-soft'];

  return (
    <LinearGradient
      colors={['rgba(202, 224, 255, 0.45)', tokens.colors['color-surface-base']]}
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

        <View style={{ gap: tokens.spacing['space-8'] }}>
          <Text style={getTypographyStyle(tokens, 'typo-title')}>カフェフォトギャラリー</Text>
          <Text style={getTypographyStyle(tokens, 'typo-body')}>
            ブラーの質感を確かめるためのショットです。透明感のあるナビゲーションと一緒に、色味やシャドウの映り込みをチェックしてみてください。
          </Text>
        </View>

        <View style={{ gap: tokens.spacing['space-16'] }}>
          {cafeShots.map((shot) => (
            <View
              key={shot.id}
              style={{
                backgroundColor: tokens.colors['color-surface-glass'],
                borderRadius: 32,
                borderWidth: surfaceBorder.width,
                borderColor: tokens.colors[surfaceBorder.color],
                padding: tokens.spacing['space-16'],
                gap: tokens.spacing['space-12'],
                shadowColor: cardShadow.color,
                shadowOffset: { width: cardShadow.offset.width, height: cardShadow.offset.height / 2 },
                shadowOpacity: cardShadow.opacity * 0.7,
                shadowRadius: cardShadow.radius * 0.8,
                elevation: cardShadow.elevation,
              }}
            >
              <Image
                source={{ uri: shot.imageUrl }}
                style={{
                  width: '100%',
                  aspectRatio: 4 / 3,
                  borderRadius: 24,
                  backgroundColor: tokens.colors['color-surface-elevated'],
                }}
                contentFit="cover"
                transition={200}
              />
              <View style={{ gap: tokens.spacing['space-4'] }}>
                <Text style={getTypographyStyle(tokens, 'typo-title')}>{shot.title}</Text>
                <Text
                  style={{
                    ...getTypographyStyle(tokens, 'typo-footnote'),
                    color: tokens.colors['color-text-foot'],
                  }}
                >
                  {shot.location}
                </Text>
              </View>
              <Text style={getTypographyStyle(tokens, 'typo-body')}>{shot.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
