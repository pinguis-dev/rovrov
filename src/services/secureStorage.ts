import * as SecureStore from 'expo-secure-store';

const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
} as const;

export const authStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
  },

  async getTokens() {
    const accessToken = await SecureStore.getItemAsync(AUTH_KEYS.ACCESS_TOKEN);
    const refreshToken = await SecureStore.getItemAsync(AUTH_KEYS.REFRESH_TOKEN);
    return { accessToken, refreshToken };
  },

  async setUserData(userData: string) {
    await SecureStore.setItemAsync(AUTH_KEYS.USER_DATA, userData);
  },

  async getUserData() {
    return SecureStore.getItemAsync(AUTH_KEYS.USER_DATA);
  },

  async clearAll() {
    await SecureStore.deleteItemAsync(AUTH_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(AUTH_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(AUTH_KEYS.USER_DATA);
  },
};
