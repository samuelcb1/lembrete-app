import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateReminderInput, remindersService } from '@/services/reminders.service';

type Props = {
  visible: boolean;
  accessToken: string;
  onAdd: (input: CreateReminderInput) => void;
  onClose: () => void;
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatDate(d: Date) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function maskDate(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskTime(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function toISO(date: string, time: string) {
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}T${time}:00`;
}

function isValidDate(date: string) {
  if (date.length !== 10) return false;
  const [d, m, y] = date.split('/').map(Number);
  const obj = new Date(y, m - 1, d);
  return obj.getFullYear() === y && obj.getMonth() === m - 1 && obj.getDate() === d;
}

function isValidTime(time: string) {
  if (time.length !== 5) return false;
  const [h, min] = time.split(':').map(Number);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

export function AddTaskModal({ visible, accessToken, onAdd, onClose }: Props) {
  const { bottom } = useSafeAreaInsets();
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60 * 1000);
      setSummary('');
      setDescription('');
      setStartDate(formatDate(now));
      setStartTime(formatTime(now));
      setEndDate(formatDate(later));
      setEndTime(formatTime(later));
    }
  }, [visible]);

  async function pickImage(source: 'camera' | 'gallery') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Autorize o acesso nas configurações do dispositivo.');
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';

    try {
      setScanning(true);
      const extracted = await remindersService.extractFromImage(accessToken, asset.base64!, mimeType);
      if (extracted.summary) setSummary(extracted.summary);
      if (extracted.description) setDescription(extracted.description);
      if (extracted.date) setStartDate(extracted.date);
      if (extracted.startTime) setStartTime(extracted.startTime);
      if (extracted.date) setEndDate(extracted.date);
      if (extracted.endTime) setEndTime(extracted.endTime);
    } catch {
      Alert.alert('Erro', 'Não foi possível extrair os dados da imagem.');
    } finally {
      setScanning(false);
    }
  }

  function handleScanPress() {
    Alert.alert('Ler imagem', 'Escolha a origem da imagem', [
      { text: 'Câmera', onPress: () => pickImage('camera') },
      { text: 'Galeria', onPress: () => pickImage('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  const isValid =
    summary.trim().length > 0 &&
    isValidDate(startDate) && isValidTime(startTime) &&
    isValidDate(endDate) && isValidTime(endTime);

  function handleAdd() {
    if (!isValid) return;
    onAdd({
      summary: summary.trim(),
      description: description.trim() || undefined,
      startDateTime: toISO(startDate, startTime),
      endDateTime: toISO(endDate, endTime),
      timeZone: 'America/Sao_Paulo',
    });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingBottom: bottom + 16 }} className="bg-zinc-900 rounded-t-3xl px-6 pt-4 gap-5">
          <View className="w-10 h-1 bg-zinc-700 rounded-full self-center mb-1" />

          <View className="flex-row items-center justify-between">
            <Text className="text-white text-xl font-bold">Novo Lembrete</Text>
            <Pressable
              className="flex-row items-center gap-2 bg-zinc-800 px-4 py-2 rounded-xl"
              onPress={handleScanPress}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <Text className="text-sky-400 text-sm font-semibold">Ler imagem</Text>
              )}
            </Pressable>
          </View>

          {scanning && (
            <View className="bg-sky-950 rounded-2xl px-4 py-3 flex-row items-center gap-3">
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text className="text-sky-300 text-sm">Analisando imagem...</Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 360 }}
          >
            <View className="gap-4">
              <View className="gap-1.5">
                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest px-1">Título</Text>
                <TextInput
                  className="bg-zinc-800 text-white rounded-2xl px-4 py-3.5 text-base"
                  placeholder="Ex: Reunião de equipe"
                  placeholderTextColor="#52525b"
                  value={summary}
                  onChangeText={setSummary}
                  autoFocus
                  returnKeyType="next"
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest px-1">Descrição</Text>
                <TextInput
                  className="bg-zinc-800 text-white rounded-2xl px-4 py-3.5 text-base"
                  placeholder="Opcional"
                  placeholderTextColor="#52525b"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest px-1">Início</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-zinc-800 text-white rounded-2xl px-4 py-3.5 text-base"
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#52525b"
                    value={startDate}
                    onChangeText={v => setStartDate(maskDate(v))}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TextInput
                    className="w-28 bg-zinc-800 text-white rounded-2xl px-4 py-3.5 text-base text-center"
                    placeholder="HH:MM"
                    placeholderTextColor="#52525b"
                    value={startTime}
                    onChangeText={v => setStartTime(maskTime(v))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest px-1">Fim</Text>
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-zinc-800 text-white rounded-2xl px-4 py-3.5 text-base"
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor="#52525b"
                    value={endDate}
                    onChangeText={v => setEndDate(maskDate(v))}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TextInput
                    className="w-28 bg-zinc-800 text-white rounded-2xl px-4 py-3.5 text-base text-center"
                    placeholder="HH:MM"
                    placeholderTextColor="#52525b"
                    value={endTime}
                    onChangeText={v => setEndTime(maskTime(v))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View className="flex-row gap-3 pt-1">
            <Pressable
              className="flex-1 bg-zinc-800 py-4 rounded-2xl items-center"
              onPress={onClose}
            >
              <Text className="text-zinc-400 font-semibold text-base">Cancelar</Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-4 rounded-2xl items-center ${isValid ? 'bg-sky-600' : 'bg-sky-950'}`}
              onPress={handleAdd}
              disabled={!isValid}
            >
              <Text className={`font-semibold text-base ${isValid ? 'text-white' : 'text-sky-800'}`}>
                Adicionar
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
