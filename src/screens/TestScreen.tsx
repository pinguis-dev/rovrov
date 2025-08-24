import React from 'react';

import { View, StyleSheet } from 'react-native';

import { TestComponent } from '@components/TestComponent';

export const TestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <TestComponent message="絶対パス import テスト成功！" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
});
