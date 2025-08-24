import React from 'react';

import { View, Text, StyleSheet } from 'react-native';

export interface TestComponentProps {
  message: string;
}

export const TestComponent: React.FC<TestComponentProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
  },
  text: {
    color: '#333',
    fontSize: 16,
  },
});
