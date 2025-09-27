import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomTabBarAutoHide } from '@/components/tab-bar-visibility';
import { useDesignTokens } from '@/design/design-system';
import type { TypographyTokenName } from '@/design/tokens';

const notifications = [
  {
    id: 'notice-1',
    title: 'Yuri bookmarked your post',
    detail: '“Seaside Espresso Stand” was saved to Yuri’s “Weekend” list.',
    timeAgo: '3m ago',
  },
  {
    id: 'notice-2',
    title: 'Map suggestion ready',
    detail: 'Two new rooftop spots near Shibuya match your saved tags.',
    timeAgo: '12m ago',
  },
  {
    id: 'notice-3',
    title: 'Supabase sync complete',
    detail: 'Your offline draft “Night walk in Yanaka” successfully uploaded.',
    timeAgo: '42m ago',
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

export default function NotificationsScreen() {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();
  const border = tokens.borders['border-0.3'];
  const handleScroll = useBottomTabBarAutoHide();

  return (
    <LinearGradient
      colors={[tokens.colors['color-surface-base'], tokens.colors['color-surface-glass']]}
      locations={[0, 1]}
      style={styles.gradient}
    >
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + tokens.spacing['space-32'],
          paddingBottom: tokens.spacing['space-24'],
          paddingHorizontal: tokens.spacing['space-24'],
          gap: tokens.spacing['space-16'],
        }}
      >
        <Text style={getTypographyStyle(tokens, 'typo-display')}>最新の通知</Text>
        <Text style={getTypographyStyle(tokens, 'typo-body')}>
          タップすると詳細からタイムラインやマップに遷移できる想定です。フィードバックはリアルタイムに同期されます。
        </Text>

        <View style={{ gap: tokens.spacing['space-12'] }}>
          {notifications.map((item) => (
            <View
              key={item.id}
              style={{
                backgroundColor: tokens.colors['color-surface-elevated'],
                borderRadius: 24,
                borderWidth: border.width,
                borderColor: tokens.colors[border.color],
                padding: tokens.spacing['space-16'],
                gap: tokens.spacing['space-8'],
              }}
            >
              <Text style={getTypographyStyle(tokens, 'typo-title')}>{item.title}</Text>
              <Text style={getTypographyStyle(tokens, 'typo-body')}>{item.detail}</Text>
              <Text
                style={{
                  ...getTypographyStyle(tokens, 'typo-footnote'),
                  color: tokens.colors['color-text-foot'],
                }}
              >
                {item.timeAgo}
              </Text>
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
