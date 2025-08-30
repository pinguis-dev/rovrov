import React from 'react';

import { ActivityIndicator, ActivityIndicatorProps, StyleSheet } from 'react-native';

import { colors } from '../../styles/colors';

interface LoadingSpinnerProps extends ActivityIndicatorProps {
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  color = colors.neutral[700],
  size = 'large',
  style,
  ...props
}) => {
  return (
    <ActivityIndicator
      color={color}
      size={size}
      style={[styles.spinner, style]}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  spinner: {
    // Default styles can be added here
  },
});
