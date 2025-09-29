import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomTabBarAutoHide } from '@/components/tab-bar-visibility';
import { useDesignTokens } from '@/design/design-system';
import type { TypographyTokenName } from '@/design/tokens';

const quickActions = [
  {
    id: 'action-1',
    label: 'Edit profile',
    helper: 'Update name, tagline, and cover media',
  },
  {
    id: 'action-2',
    label: 'Manage posting privacy',
    helper: 'Default visibility for new adventures',
  },
  {
    id: 'action-3',
    label: 'Connected services',
    helper: 'Supabase Auth, Cloudflare Stream bindings',
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

export default function AccountScreen() {
  const tokens = useDesignTokens();
  const insets = useSafeAreaInsets();
  const border = tokens.borders['border-0.3'];
  const handleScroll = useBottomTabBarAutoHide();

  return (
    <LinearGradient
      colors={['rgba(202, 224, 255, 0.3)', tokens.colors['color-surface-base']]}
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
        <View style={{ gap: tokens.spacing['space-4'] }}>
          <Text style={getTypographyStyle(tokens, 'typo-display')}>アカウントと設定</Text>
          <Text style={getTypographyStyle(tokens, 'typo-body')}>
            プロフィールの調整や通知の好み、接続サービスをここから管理します。モバイルとWebの設定を共通化します。
          </Text>
        </View>

        <View
          style={{
            backgroundColor: tokens.colors['color-surface-glass'],
            borderRadius: 28,
            borderWidth: border.width,
            borderColor: tokens.colors[border.color],
            padding: tokens.spacing['space-24'],
            gap: tokens.spacing['space-16'],
          }}
        >
          <Text style={getTypographyStyle(tokens, 'typo-title')}>Profile snapshot</Text>
          <Text style={getTypographyStyle(tokens, 'typo-body')}>
            透明感のある UI
            を維持するため、プロフィール写真はガラス調マスクで表示予定です。ストレージは Supabase
            Storage と同期。
          </Text>
        </View>

        <View style={{ gap: tokens.spacing['space-12'] }}>
          {quickActions.map((action) => (
            <View
              key={action.id}
              style={{
                backgroundColor: tokens.colors['color-surface-elevated'],
                borderRadius: 24,
                borderWidth: border.width,
                borderColor: tokens.colors[border.color],
                paddingVertical: tokens.spacing['space-16'],
                paddingHorizontal: tokens.spacing['space-24'],
                gap: tokens.spacing['space-4'],
              }}
            >
              <Text
                style={{
                  ...getTypographyStyle(tokens, 'typo-body'),
                  color: tokens.colors['color-text-title'],
                }}
              >
                {action.label}
              </Text>
              <Text
                style={{
                  ...getTypographyStyle(tokens, 'typo-footnote'),
                  color: tokens.colors['color-text-foot'],
                }}
              >
                {action.helper}
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
