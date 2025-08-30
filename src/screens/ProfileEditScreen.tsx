import React, { useState, useEffect, useRef, useMemo } from 'react';

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import {
  View,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { defaultAvatar } from '../assets';
import { TextInput, LoadingSpinner } from '../components/ui';
import { COUNTRIES, getCountry, getRegion, Country, Region } from '../data/geo';
import { useDebounce } from '../hooks/useDebounce';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';
import { ProfileFormData } from '../types';

enum ProfileSetupStep {
  INTRO = 0,
  USERNAME = 1,
  DISPLAY_NAME = 2,
  AVATAR = 3,
  LOCATION = 4,
  BIO = 5,
}

interface ProfileEditScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ navigation }) => {
  // const { user } = useAuthStore();
  // Mock user for testing
  const user = { id: 'mock-user-id' };
  const [currentStep, setCurrentStep] = useState(ProfileSetupStep.INTRO);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Location (Country -> Region) selection states
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [selectedRegionCode, setSelectedRegionCode] = useState<string | null>(null);
  const regionListRef = useRef<FlatList<Region>>(null);
  const REGION_ROW_HEIGHT = 48;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<ProfileFormData>({
    // 明示的に設定（エラー後はonChangeで再検証）
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      username: '',
      display_name: '',
      bio: '',
      location: '',
      website_url: '',
      avatar_url: '',
      header_url: '',
    },
  });

  const watchedUsername = watch('username');
  const watchedAvatarUrl = watch('avatar_url');
  const watchedDisplayName = watch('display_name');
  const watchedBio = watch('bio');
  const watchedLocation = watch('location');
  const debouncedUsername = useDebounce(watchedUsername, 500);
  // 可用性チェックの競合回避用ID
  const availabilityCheckId = useRef(0);

  // Username一意性チェック
  useEffect(() => {
    if (debouncedUsername && debouncedUsername.length >= 3) {
      checkUsernameAvailability(debouncedUsername);
    } else {
      setUsernameAvailable(null);
    }
  }, [debouncedUsername]);

  const animateTransition = (direction: 'forward' | 'backward') => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'forward' ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (direction === 'forward') {
        setCurrentStep(currentStep + 1);
      } else {
        setCurrentStep(currentStep - 1);
      }

      slideAnim.setValue(direction === 'forward' ? 20 : -20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goFromIntro = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(ProfileSetupStep.USERNAME);
      slideAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < ProfileSetupStep.BIO) {
      animateTransition('forward');
    }
  };

  const prevStep = () => {
    if (currentStep > ProfileSetupStep.USERNAME) {
      animateTransition('backward');
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case ProfileSetupStep.INTRO:
        return true;
      case ProfileSetupStep.USERNAME:
        return trigger('username');
      case ProfileSetupStep.DISPLAY_NAME:
        return trigger('display_name');
      case ProfileSetupStep.AVATAR:
        return true; // アバターは任意
      case ProfileSetupStep.LOCATION:
        return trigger('location');
      case ProfileSetupStep.BIO:
        return trigger('bio');
      default:
        return true;
    }
  };

  // Next button enable/disable (cheap, synchronous checks)
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case ProfileSetupStep.USERNAME: {
        const v = watchedUsername || '';
        if (v.length < 3 || v.length > 30) return false;
        if (!/^[a-zA-Z0-9_-]+$/.test(v)) return false;
        if (usernameAvailable === false) return false;
        return true;
      }
      case ProfileSetupStep.DISPLAY_NAME: {
        const v = watchedDisplayName || '';
        if (!v.trim()) return false;
        if (v.length > 50) return false;
        return true;
      }
      case ProfileSetupStep.AVATAR:
        return true; // optional
      case ProfileSetupStep.LOCATION:
        return Boolean(watchedLocation && selectedCountryCode && selectedRegionCode);
      case ProfileSetupStep.BIO: {
        const v = watchedBio || '';
        return v.length <= 300;
      }
      default:
        return true;
    }
  }, [
    currentStep,
    watchedUsername,
    usernameAvailable,
    watchedDisplayName,
    watchedLocation,
    selectedCountryCode,
    selectedRegionCode,
    watchedBio,
  ]);

  const checkUsernameAvailability = (username: string) => {
    try {
      const id = availabilityCheckId.current + 1;
      availabilityCheckId.current = id;
      // const isAvailable = await profileApi.checkUsernameAvailability(username);
      // Mock username availability check
      const isAvailable = username !== 'admin' && username !== 'test';
      if (availabilityCheckId.current === id) {
        setUsernameAvailable(isAvailable);
      }
    } catch (error) {
      console.error('Username check error:', error);
      setUsernameAvailable(null);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert('権限エラー', '写真ライブラリへのアクセス権限が必要です');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadImage(asset.uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploadingAvatar(true);

    try {
      // 画像圧縮
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: 300,
              height: 300,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      // Storage アップロード (Mock)
      // const uploadResult = await profileApi.uploadProfileImage(manipResult.uri, 'avatar');
      // Mock upload result
      const uploadResult = { url: manipResult.uri };

      // フォームにURL設定
      setValue('avatar_url', uploadResult.url, {
        shouldDirty: true,
      });

      Alert.alert('成功', '画像をアップロードしました');
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('エラー', '画像のアップロードに失敗しました');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleStepAction = async () => {
    if (currentStep === ProfileSetupStep.BIO) {
      await handleSubmit(onSubmit)();
    } else {
      await nextStep();
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // await profileApi.updateProfile(user.id, data);
      // Mock successful profile update
      // eslint-disable-next-line no-console
      console.log('Mock profile update:', data);
      Alert.alert('成功', 'プロファイルが作成されました！', [
        { text: 'OK', onPress: navigation.goBack },
      ]);
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error instanceof Error ? error.message : '更新に失敗しました';
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUsername = (value: string) => {
    if (value.length < 3) return '3文字以上で入力してください';
    if (value.length > 30) return '30文字以内で入力してください';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return '英数字、アンダースコア、ハイフンのみ使用できます';
    if (usernameAvailable === false) return 'このユーザー名は既に使用されています';
    return true;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case ProfileSetupStep.INTRO:
        return 'アカウントを作成しましょう';
      case ProfileSetupStep.USERNAME:
        return 'あなたのアカウントIDは？';
      case ProfileSetupStep.DISPLAY_NAME:
        return 'あなたの名前は？';
      case ProfileSetupStep.AVATAR:
        return 'プロフィール画像';
      case ProfileSetupStep.LOCATION:
        return 'あなたに近い場所';
      case ProfileSetupStep.BIO:
        return 'bioを書こう';
      default:
        return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case ProfileSetupStep.INTRO:
        return renderIntroStep();
      case ProfileSetupStep.USERNAME:
        return renderUsernameStep();
      case ProfileSetupStep.DISPLAY_NAME:
        return renderDisplayNameStep();
      case ProfileSetupStep.AVATAR:
        return renderAvatarStep();
      case ProfileSetupStep.LOCATION:
        return renderLocationStep();
      case ProfileSetupStep.BIO:
        return renderBioStep();
      default:
        return null;
    }
  };

  const renderIntroStep = () => (
    <TouchableOpacity activeOpacity={0.9} onPress={goFromIntro} style={styles.introContainer}>
      <Text style={styles.introTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        アカウントを作成しましょう
      </Text>
    </TouchableOpacity>
  );

  const renderUsernameStep = () => (
    <Controller
      key="username-controller"
      control={control}
      name="username"
      rules={{ validate: validateUsername }}
      render={({ field: { onChange, value } }) => (
        <View style={styles.inputContainer}>
          <TextInput
            value={value}
            onChangeText={(text) => {
              // RHFの値更新 + 入力開始時にエラーを即時クリア
              onChange(text);
              clearErrors('username');
              // 入力のたびに可用性表示はリセット（最新入力のみ表示）
              setUsernameAvailable(null);
            }}
            placeholder="rovrov123"
            autoCapitalize="none"
            error={
              errors.username?.message ||
              (usernameAvailable === false ? '✗ 既に使用されています' : undefined)
            }
            success={usernameAvailable === true && !errors.username ? '✓ 使用可能です' : undefined}
          />
          {/* TextInputのメッセージ枠を利用するため追加の枠は不要 */}
        </View>
      )}
    />
  );

  const renderDisplayNameStep = () => (
    <Controller
      key="display-name-controller"
      control={control}
      name="display_name"
      rules={{
        required: '表示名を入力してください',
        maxLength: { value: 50, message: '50文字以内で入力してください' },
      }}
      render={({ field: { onChange, value } }) => (
        <View style={styles.inputContainer}>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="name"
            error={errors.display_name?.message}
          />
        </View>
      )}
    />
  );

  const renderAvatarStep = () => (
    <View key="avatar-step-root" style={styles.avatarStepContainer}>
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => {
          pickImage().catch(() => {
            // Handle error silently
          });
        }}
      >
        {watchedAvatarUrl ? (
          <Image source={{ uri: watchedAvatarUrl }} style={styles.avatarImage} />
        ) : (
          <Image source={defaultAvatar} style={styles.avatarImage} />
        )}
        {isUploadingAvatar && (
          <View style={styles.avatarUploadOverlay}>
            <LoadingSpinner color={colors.neutral[0]} size="small" />
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.avatarHelperText}>タップして画像を選択</Text>
    </View>
  );

  const renderLocationStep = () => (
    <Controller
      key="location-controller"
      control={control}
      name="location"
      rules={{ required: '場所を選択してください' }}
      render={({ field: { onChange, value: _value } }) => {
        const country = getCountry(selectedCountryCode);
        const region = getRegion(selectedCountryCode, selectedRegionCode);

        const countryLabel = country ? country.name : '国を選択';
        let regionLabel = '';
        if (region) regionLabel = region.name;
        else if (country) regionLabel = '地域を選択';
        else regionLabel = '先に国を選択';

        const openCountry = () => {
          clearErrors('location');
          setCountryModalVisible(true);
        };
        const openRegion = () => {
          if (!country) return;
          clearErrors('location');
          setRegionModalVisible(true);
        };

        const handleSelectCountry = (c: Country) => {
          setSelectedCountryCode(c.code);
          setSelectedRegionCode(null);
          onChange('');
          clearErrors('location');
          setCountryModalVisible(false);
        };

        const handleSelectRegion = (r: Region) => {
          setSelectedRegionCode(r.code);
          const label = `${getCountry(selectedCountryCode)?.name ?? ''} / ${r.name}`.trim();
          onChange(label);
          clearErrors('location');
          setRegionModalVisible(false);
        };

        // Scroll handled by outer useEffect when modal becomes visible

        // 初期スクロール位置（選択済み > Tokyo）
        const regions = country?.regions ?? [];
        let initialIndex = -1;
        if (selectedRegionCode) {
          initialIndex = regions.findIndex((r) => r.code === selectedRegionCode);
        }
        if (initialIndex < 0) {
          if (selectedCountryCode === 'JP') {
            initialIndex = regions.findIndex((r) => r.code === 'JP-13' || r.name === 'Tokyo');
          } else if (selectedCountryCode === 'KR') {
            initialIndex = regions.findIndex((r) => r.code === 'KR-11' || r.name === 'Seoul');
          } else if (selectedCountryCode === 'US') {
            initialIndex = regions.findIndex(
              (r) =>
                r.code === 'US-DC' ||
                r.name === 'District of Columbia' ||
                r.name === 'Washington, D.C.',
            );
          }
        }

        return (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.selectButton, !country && styles.selectButtonTight]}
              onPress={openCountry}
            >
              <Text style={styles.selectText}>{countryLabel}</Text>
            </TouchableOpacity>

            {country && (
              <TouchableOpacity
                style={[styles.selectButton, styles.selectButtonTight]}
                onPress={openRegion}
              >
                <Text style={styles.selectText}>{regionLabel}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.messageSlot}>
              {errors.location?.message ? (
                <Text style={styles.errorText}>{errors.location.message}</Text>
              ) : (
                <Text style={styles.messagePlaceholder}> </Text>
              )}
            </View>

            {/* Country Modal */}
            <Modal transparent visible={countryModalVisible} animationType="fade">
              <View style={styles.modalBackdrop}>
                <View style={styles.modalSheet}>
                  <Text style={styles.modalTitle}>国を選択</Text>
                  <FlatList
                    data={COUNTRIES}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleSelectCountry(item)}
                        style={styles.modalItem}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    onPress={() => setCountryModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Text style={styles.modalCloseText}>閉じる</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Region Modal */}
            <Modal transparent visible={regionModalVisible} animationType="fade">
              <View style={styles.modalBackdrop}>
                <View style={styles.modalSheet}>
                  <Text style={styles.modalTitle}>地域を選択</Text>
                  <FlatList
                    ref={regionListRef}
                    data={regions}
                    initialScrollIndex={initialIndex >= 0 ? initialIndex : undefined}
                    getItemLayout={(_data, index) => ({
                      length: REGION_ROW_HEIGHT,
                      offset: REGION_ROW_HEIGHT * index,
                      index,
                    })}
                    keyExtractor={(item) => item.code}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleSelectRegion(item)}
                        style={styles.modalItem}
                      >
                        <Text style={styles.modalItemText}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    onScrollToIndexFailed={(info) => {
                      // レイアウト計測前のフォールバック
                      setTimeout(() => {
                        try {
                          regionListRef.current?.scrollToIndex({
                            index: info.index,
                            animated: false,
                            viewPosition: 0.5,
                          });
                        } catch {
                          // ignore
                        }
                      }, 50);
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setRegionModalVisible(false)}
                    style={styles.modalClose}
                  >
                    <Text style={styles.modalCloseText}>閉じる</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        );
      }}
    />
  );

  const renderBioStep = () => (
    <Controller
      key="bio-controller"
      control={control}
      name="bio"
      rules={{
        maxLength: { value: 300, message: '300文字以内で入力してください' },
      }}
      render={({ field: { onChange, value } }) => (
        <View style={styles.inputContainer}>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="あなたの趣味や興味について教えてください..."
            multiline
            numberOfLines={4}
            error={errors.bio?.message}
            style={styles.bioInput}
          />
          <View style={styles.counterRow}>
            <Text
              style={
                (value?.length || 0) > 300
                  ? styles.counterDanger
                  : (value?.length || 0) >= 240
                    ? styles.counterWarning
                    : styles.counterText
              }
            >
              {value?.length || 0} / 300
            </Text>
          </View>
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ステップヘッダー（INTROでは非表示） */}
          {currentStep !== ProfileSetupStep.INTRO && (
            <View
              style={[
                styles.stepHeader,
                currentStep === ProfileSetupStep.AVATAR ? styles.stepHeaderTight : null,
              ]}
            >
              <Text style={styles.stepTitle}>{getStepTitle()}</Text>
            </View>
          )}

          {/* ステップコンテンツ */}
          <Animated.View
            style={[
              styles.stepContent,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {renderStepContent()}
          </Animated.View>

          {/* ナビゲーションボタン（INTROでは非表示） */}
          {currentStep !== ProfileSetupStep.INTRO && (
            <View style={styles.navigationContainer}>
              {currentStep > ProfileSetupStep.USERNAME && (
                <TouchableOpacity onPress={prevStep} style={styles.iconButton}>
                  <Text style={styles.backButtonIcon}>‹</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  handleStepAction().catch(() => {
                    // Handle error silently
                  });
                }}
                style={[styles.iconButton, (isLoading || !canProceed) && styles.iconButtonDisabled]}
                disabled={isLoading || !canProceed}
              >
                <Text style={styles.nextButtonIcon}>{isLoading ? '...' : '›'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 進捗表示（INTROでは非表示） */}
          {currentStep !== ProfileSetupStep.INTRO && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{currentStep} / 5</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: colors.neutral[200],
    borderRadius: 75,
    height: 150,
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    width: 150,
  },
  avatarHelperText: {
    ...typography.footnote,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  avatarImage: {
    borderRadius: 75,
    height: 150,
    width: 150,
  },
  avatarStepContainer: {
    alignItems: 'center',
  },
  avatarUploadOverlay: {
    alignItems: 'center',
    backgroundColor: `${colors.neutral[900]}80`,
    borderRadius: 75,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backButtonIcon: {
    color: colors.neutral[900],
    fontSize: 36,
    fontWeight: '200',
    textAlign: 'center',
  },
  bioInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  container: {
    flex: 1,
  },
  counterDanger: {
    color: colors.semantic.error,
  },
  counterRow: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
    width: '100%',
  },
  counterText: {
    ...typography.footnote,
    color: colors.neutral[600],
  },
  counterWarning: {
    color: colors.semantic.warning,
  },
  errorText: {
    ...typography.footnote,
    color: colors.semantic.error,
    paddingHorizontal: 4,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  inputContainer: {
    maxWidth: 300,
    width: '100%',
  },
  introContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
    paddingVertical: 40,
    width: '100%',
  },
  introTitle: {
    color: colors.neutral[900],
    fontSize: 30,
    fontWeight: '200',
    lineHeight: 38,
    textAlign: 'center',
  },
  messagePlaceholder: {
    ...typography.footnote,
    opacity: 0,
  },
  messageSlot: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    minHeight: (typography.footnote.lineHeight as number) ?? 20,
    paddingHorizontal: 4,
  },
  // Modal styles (alphabetically before navigationContainer)
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: `${colors.neutral[900]}55`,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalClose: {
    borderTopColor: colors.neutral[200],
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalCloseText: {
    ...typography.body,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  modalItem: {
    alignItems: 'flex-start',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalItemText: {
    ...typography.body,
    color: colors.neutral[900],
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderRadius: 12,
    maxHeight: '70%',
    paddingVertical: 12,
    width: '100%',
  },
  modalTitle: {
    ...typography.body,
    color: colors.neutral[900],
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navigationContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    minHeight: 44,
    paddingHorizontal: 64,
  },
  nextButtonIcon: {
    color: colors.neutral[900],
    fontSize: 36,
    fontWeight: '200',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingBottom: 32,
  },
  progressText: {
    ...typography.footnote,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  safeArea: {
    backgroundColor: colors.neutral[0],
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  selectButton: {
    backgroundColor: colors.neutral[200],
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 16,
  },
  // Use for the last select just before the message
  selectButtonTight: {
    marginBottom: 0,
  },
  selectText: {
    ...typography.body,
    color: colors.neutral[700],
    fontWeight: '300',
  },
  stepContent: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 88,
  },
  stepHeaderTight: {
    marginBottom: 48,
  },
  stepTitle: {
    color: colors.neutral[900],
    fontSize: 30,
    fontWeight: '200',
    lineHeight: 38,
    textAlign: 'center',
  },
});
