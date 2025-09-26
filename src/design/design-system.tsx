import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { designTokens, type DesignTokens } from './tokens';

const DesignTokensContext = createContext<DesignTokens>(designTokens);

export function ThemeProvider({ children }: PropsWithChildren): ReactElement {
  const value = useMemo(() => designTokens, []);

  return (
    <DesignTokensContext.Provider value={value}>
      <View style={[styles.surface, { backgroundColor: value.colors['color-surface-base'] }]}>
        {children}
      </View>
    </DesignTokensContext.Provider>
  );
}

export function useDesignTokens(): DesignTokens {
  return useContext(DesignTokensContext);
}

export const DesignSystemProvider = ThemeProvider;

const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
});
