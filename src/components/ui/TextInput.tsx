import React from 'react';

import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  success?: string;
}

export const TextInput: React.FC<TextInputProps> = ({ label, error, success, style, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.neutral[500]}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      />
      <Text
        style={[
          styles.messageRow,
          error ? styles.messageError : success ? styles.messageSuccess : styles.messageHidden,
        ]}
      >
        {error || success || ' '}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.neutral[200],
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    ...typography.body,
    borderWidth: 0,
    color: colors.neutral[700],
    fontWeight: '300',
    paddingBottom: 18,
    paddingTop: 14,
    textAlignVertical: 'center',
  },
  inputError: {
    borderColor: colors.semantic.error,
    borderWidth: 1,
  },
  label: {
    ...typography.body,
    color: colors.neutral[600],
    fontWeight: '400',
    marginBottom: 8,
  },
  messageError: {
    color: colors.semantic.error,
  },
  messageHidden: {
    opacity: 0,
  },
  messageRow: {
    ...typography.footnote,
    marginTop: spacing.xs,
    minHeight: typography.footnote.lineHeight as number,
    paddingHorizontal: 4,
  },
  messageSuccess: {
    color: colors.semantic.successMuted,
  },
});
