import React, { useState, useRef, useEffect } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedCityNames } from '../../components/AnimatedCityNames';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../styles/colors';
import { AuthState } from '../../types/auth';
import { emailValidation } from '../../utils/validation';

import { styles } from './styles';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>(AuthState.IDLE);
  const [emailSent, setEmailSent] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);

  // isLoadingを削除して、ローカルのauthStateを使用
  const { signInWithMagicLink, error, clearError } = useAuthStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('emailSent changed to:', emailSent);
    if (emailSent) {
      console.log('Starting fade animation for success screen');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 60秒のカウントダウンを開始
      setCanResend(false);
      setResendCountdown(60);

      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [emailSent, fadeAnim]);

  const handleSendMagicLink = async () => {
    console.log('handleSendMagicLink called with email:', email);
    Keyboard.dismiss();

    if (!email.trim()) {
      console.log('Email is empty');
      setLocalError('メールアドレスを入力してください');
      return;
    }

    if (!emailValidation.validate(email)) {
      console.log('Email validation failed for:', email);
      setLocalError('正しいメールアドレスの形式で入力してください');
      return;
    }

    setLocalError(null);
    setAuthState(AuthState.SENDING);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      console.log('Sending magic link to:', emailValidation.normalize(email));
      await signInWithMagicLink(emailValidation.normalize(email));
      console.log('Magic link sent successfully');
      console.log('Setting emailSent to true');
      setEmailSent(true);
      setAuthState(AuthState.SUCCESS);
      console.log('State updated - emailSent should be true now');
    } catch (error: any) {
      console.error('Magic link error:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      setAuthState(AuthState.ERROR);
      // authStoreのエラーメッセージをそのまま使用
      setLocalError(error.message || 'メール送信に失敗しました。もう一度お試しください');
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (localError) {
      setLocalError(null);
    }
    if (error) {
      clearError();
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    setAuthState(AuthState.IDLE);
    fadeAnim.setValue(0);
  };

  const handleResendMagicLink = async () => {
    console.log('Resending magic link to:', email);
    setAuthState(AuthState.SENDING);
    setResendSuccess(false);

    try {
      await signInWithMagicLink(emailValidation.normalize(email));
      console.log('Magic link resent successfully');
      setAuthState(AuthState.SUCCESS);
      setResendSuccess(true);

      // タイマーをリセット
      setCanResend(false);
      setResendCountdown(60);

      // 3秒後にメッセージを元に戻す
      setTimeout(() => setResendSuccess(false), 3000);

      // 60秒後に再度再送信可能にする
      setTimeout(() => {
        setCanResend(true);
      }, 60000);
    } catch (error: any) {
      console.error('Resend error:', error);
      setAuthState(AuthState.ERROR);
      // レート制限エラーの場合は、秒数を抽出して表示
      if (error.message?.includes('after')) {
        const seconds = error.message.match(/(\d+) seconds/)?.[1];
        if (seconds) {
          setResendCountdown(parseInt(seconds));
        }
      }
    }
  };

  console.log('Render check - emailSent:', emailSent, 'authState:', authState);

  if (emailSent) {
    console.log('Rendering success screen');
    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.successContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.successIcon}>
            <Text style={styles.successIconEmoji}>✉️</Text>
          </View>
          <Text style={styles.successTitle}>{email}</Text>
          <Text style={styles.successMessage}>
            認証リンクを送信しました
            {'\n'}メールを確認して、リンクをタップしてください
          </Text>

          <View style={styles.resendContainer}>
            {resendSuccess ? (
              <Text style={styles.resendSuccessText}>✓ メールを再送信しました</Text>
            ) : canResend ? (
              <>
                <Text style={styles.resendText}>メールが届かない場合は</Text>
                <TouchableOpacity
                  onPress={() => void handleResendMagicLink()}
                  disabled={authState === AuthState.SENDING}
                >
                  <Text
                    style={[
                      styles.resendLink,
                      authState === AuthState.SENDING && styles.resendLinkDisabled,
                    ]}
                  >
                    {authState === AuthState.SENDING ? '送信中...' : '再送信'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.resendText}>再送信は{resendCountdown}秒後に可能です</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.resendButton]}
            onPress={handleResendEmail}
          >
            <Text style={styles.buttonText}>メールアドレスを変更</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.safeArea}
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Text style={styles.logo}>rovrov</Text>
                <AnimatedCityNames />
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, localError || error ? styles.inputError : null]}
                    placeholder="メールアドレス"
                    placeholderTextColor={colors.neutral[500]}
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={authState !== AuthState.SENDING}
                  />
                  {(localError || error) && (
                    <Text style={styles.errorText}>{localError || error?.message}</Text>
                  )}
                </View>

                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      authState === AuthState.SENDING ? styles.buttonDisabled : null,
                    ]}
                    onPress={() => void handleSendMagicLink()}
                    disabled={authState === AuthState.SENDING}
                  >
                    {authState === AuthState.SENDING ? (
                      <ActivityIndicator color={colors.neutral[0]} />
                    ) : (
                      <Text style={styles.buttonText}>次へ</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                続けることで
                <Text style={styles.linkText}>利用規約</Text>と
                <Text style={styles.linkText}>プライバシーポリシー</Text>
                に同意したものとみなされます
              </Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};
