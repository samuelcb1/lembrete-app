import { authService, AuthTokens, UserProfile } from '@/services/auth.service';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { createContext, useContext, useEffect, useState } from 'react';

const GOOGLE_WEB_CLIENT_ID = '495821921383-t03q7s06ktql3m2p1mgifk6qjuvh8jjc.apps.googleusercontent.com';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: UserProfile; accessToken: string };

type AuthContextType = {
  state: AuthState;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });
    restoreSession();
  }, []);

  async function restoreSession() {
    const tokens = await authService.getStoredTokens();
    if (!tokens) {
      setState({ status: 'unauthenticated' });
      return;
    }

    const cachedProfile = await authService.getStoredProfile();
    if (cachedProfile) {
      setState({ status: 'authenticated', user: cachedProfile, accessToken: tokens.accessToken });
      validateTokenInBackground(tokens);
      return;
    }

    try {
      const user = await authService.getProfile(tokens.accessToken);
      await authService.saveProfile(user);
      setState({ status: 'authenticated', user, accessToken: tokens.accessToken });
    } catch {
      await handleExpiredTokens(tokens);
    }
  }

  async function validateTokenInBackground(tokens: AuthTokens) {
    try {
      const user = await authService.getProfile(tokens.accessToken);
      await authService.saveProfile(user);
      setState(prev =>
        prev.status === 'authenticated' ? { ...prev, user } : prev
      );
    } catch {
      await handleExpiredTokens(tokens);
    }
  }

  async function handleExpiredTokens(tokens: AuthTokens) {
    try {
      const refreshed = await authService.refreshTokens(tokens.refreshToken);
      const user = await authService.getProfile(refreshed.accessToken);
      await authService.saveProfile(user);
      setState({ status: 'authenticated', user, accessToken: refreshed.accessToken });
    } catch {
      await authService.clearTokens();
      setState({ status: 'unauthenticated' });
    }
  }

  async function signInWithGoogle() {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    const serverAuthCode = userInfo.data?.serverAuthCode;
    if (!idToken) throw new Error('Não foi possível obter o token do Google');
    if (!serverAuthCode) throw new Error('Não foi possível obter o serverAuthCode do Google');
    const tokens = await authService.loginWithGoogleToken({ idToken, serverAuthCode });
    const user = await authService.getProfile(tokens.accessToken);
    await authService.saveProfile(user);
    setState({ status: 'authenticated', user, accessToken: tokens.accessToken });
  }

  async function signOut() {
    await Promise.allSettled([
      GoogleSignin.signOut(),
      authService.clearTokens(),
    ]);
    setState({ status: 'unauthenticated' });
  }

  return (
    <AuthContext.Provider value={{ state, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
