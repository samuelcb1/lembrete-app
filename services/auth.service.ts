import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

const api = axios.create({ baseURL: API_BASE_URL });

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
} as const;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export const authService = {
  async loginWithGoogleToken(idToken: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/google/token', { idToken });
    await authService.saveTokens(data);
    return data;
  },

  async getProfile(accessToken: string): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
    await authService.saveTokens(data);
    return data;
  },

  async saveTokens(tokens: AuthTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken),
    ]);
  },

  async getStoredTokens(): Promise<AuthTokens | null> {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(KEYS.accessToken),
      SecureStore.getItemAsync(KEYS.refreshToken),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
    ]);
  },
};
