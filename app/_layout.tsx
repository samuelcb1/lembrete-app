import '../global.css';

import { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function LoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-zinc-950 gap-6">
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Image
          source={require('../assets/images/icon.png')}
          className="w-24 h-24 rounded-3xl"
        />
      </Animated.View>
    </View>
  );
}

function RootLayoutNav() {
  const { state } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (state.status === 'loading') return;
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (state.status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (state.status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [state.status, segments]);

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
