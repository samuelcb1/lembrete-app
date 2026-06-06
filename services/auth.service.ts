import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/api';

const api = axios.create({ baseURL: API_BASE_URL });

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  userProfile: 'user_profile',
} as const;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
};

export type GoogleTokenInput = {
  idToken: string;
  serverAuthCode: string;
};

export const authService = {
  async loginWithGoogleToken(input: GoogleTokenInput): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>('/auth/google/token', input);
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

  async saveProfile(profile: UserProfile): Promise<void> {
    await SecureStore.setItemAsync(KEYS.userProfile, JSON.stringify(profile));
  },

  async getStoredProfile(): Promise<UserProfile | null> {
    const raw = await SecureStore.getItemAsync(KEYS.userProfile);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
      SecureStore.deleteItemAsync(KEYS.userProfile),
    ]);
  },
};
