import React from 'react';

import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  disabled,
  variant = 'primary',
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        isDisabled && styles.disabledButton,
        style,
      ]}
      disabled={isDisabled}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.neutral[0] : colors.neutral[700]}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' ? styles.primaryText : styles.secondaryText,
            isDisabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.neutral[800],
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.neutral[500],
  },
  primaryButton: {
    backgroundColor: colors.neutral[800],
  },
  primaryText: {
    ...typography.body,
    color: colors.neutral[0],
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: colors.neutral[200],
    borderColor: colors.neutral[300],
    borderWidth: 1,
  },
  secondaryText: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  text: {
    ...typography.body,
    fontWeight: '500',
  },
});
