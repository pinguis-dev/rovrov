import { StyleSheet } from 'react-native';

import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.neutral[800],
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.body,
    color: colors.neutral[0],
    fontWeight: '500',
  },
  container: {
    backgroundColor: colors.neutral[0],
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    ...typography.footnote,
    color: colors.semantic.error,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  footer: {
    alignItems: 'center',
    bottom: 40,
    left: 24,
    position: 'absolute',
    right: 24,
  },
  footerText: {
    ...typography.footnote,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
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
  inputContainer: {
    marginBottom: 24,
  },
  inputError: {
    borderColor: colors.semantic.error,
    borderWidth: 1,
  },
  linkText: {
    color: colors.semantic.link,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  logo: {
    ...typography.display,
    color: colors.neutral[800],
    marginBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  resendButton: {
    marginTop: 32,
    width: '100%',
  },
  resendContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 20,
  },
  resendLink: {
    ...typography.footnote,
    color: colors.semantic.link,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  resendLinkDisabled: {
    color: colors.neutral[500],
    opacity: 0.6,
  },
  resendSuccessText: {
    ...typography.footnote,
    color: colors.semantic.success,
  },
  resendText: {
    ...typography.footnote,
    color: colors.neutral[600],
  },
  safeArea: {
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 24,
    width: 80,
  },
  successIconEmoji: {
    fontSize: 40,
  },
  successMessage: {
    ...typography.body,
    color: colors.neutral[600],
    lineHeight: 24,
    textAlign: 'center',
  },
  successTitle: {
    ...typography.title,
    color: colors.neutral[700],
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    ...typography.body,
    color: colors.neutral[600],
  },
});
