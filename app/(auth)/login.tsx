import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuth } from '@/contexts/auth';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <View className="items-center mb-16">
        <Text className="text-4xl font-bold text-gray-900">Lembretes</Text>
        <Text className="text-base text-gray-500 mt-2">Organize seu dia com facilidade</Text>
      </View>

      <Pressable
        className="flex-row items-center bg-white border border-gray-200 rounded-xl px-6 py-4 gap-3 shadow-sm w-full"
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <Text className="text-2xl">G</Text>
        )}
        <Text className="text-gray-700 font-semibold text-base flex-1 text-center">
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </Text>
      </Pressable>

      {error && (
        <Text className="text-red-500 text-sm mt-4 text-center">{error}</Text>
      )}
    </View>
  );
}
