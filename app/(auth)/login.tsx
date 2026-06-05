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
    <View className="flex-1 bg-zinc-950 items-center justify-center px-8">
      <View className="items-center mb-14 gap-4">
        <View className="w-24 h-24 bg-sky-500/15 rounded-3xl items-center justify-center">
          <Text className="text-5xl">🔔</Text>
        </View>
        <View className="items-center gap-1.5">
          <Text className="text-white text-4xl font-bold tracking-tight">Lembrete</Text>
          <Text className="text-zinc-500 text-base">Organize seu dia com facilidade</Text>
        </View>
      </View>

      <Pressable
        className="flex-row items-center bg-white rounded-2xl px-6 py-4 gap-3 w-full active:opacity-80"
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator size="small" color="#4285F4" />
          : <Text className="text-xl font-bold text-[#4285F4]">G</Text>
        }
        <Text className="text-gray-800 font-semibold text-base flex-1 text-center">
          {loading ? 'Entrando...' : 'Continuar com Google'}
        </Text>
      </Pressable>

      {error && (
        <View className="mt-5 bg-red-500/10 rounded-xl px-4 py-3 w-full">
          <Text className="text-red-400 text-sm text-center">{error}</Text>
        </View>
      )}

      <Text className="text-zinc-700 text-xs text-center mt-12 leading-5">
        Ao continuar, você concorda com nossos{'\n'}Termos de Uso e Política de Privacidade
      </Text>
    </View>
  );
}
