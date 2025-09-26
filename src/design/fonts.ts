import { Inter_200ExtraLight, Inter_300Light, Inter_400Regular } from '@expo-google-fonts/inter';
import { NotoSansJP_300Light, NotoSansJP_400Regular } from '@expo-google-fonts/noto-sans-jp';

export const designFontSources = {
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  NotoSansJP_300Light,
  NotoSansJP_400Regular,
} as const;

export type DesignFontKey = keyof typeof designFontSources;
