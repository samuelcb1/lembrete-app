import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddTaskModal } from '@/components/add-task-modal';
import { useAuth } from '@/contexts/auth';
import { CreateReminderInput, Reminder, remindersService } from '@/services/reminders.service';

const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(name?: string) {
  return name?.split(' ')[0] ?? '';
}

function parseLocalISO(iso: string): Date {
  const [datePart, timePart = '00:00:00'] = iso.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [h = 0, m = 0, s = 0] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, h, m, s);
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

function getDayLabel(iso: string): { text: string; color: string } | null {
  const d = parseLocalISO(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDay(d, today)) return { text: 'Hoje', color: '#0ea5e9' };
  if (isSameDay(d, tomorrow)) return { text: 'Amanhã', color: '#a78bfa' };
  return null;
}

function formatTime(iso: string) {
  return parseLocalISO(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isPast(iso: string) {
  return parseLocalISO(iso) < new Date();
}

function ReminderCard({ item, onDelete }: { item: Reminder; onDelete: (id: string) => void }) {
  const start = parseLocalISO(item.startDateTime);
  const ended = isPast(item.endDateTime);
  const dayLabel = getDayLabel(item.startDateTime);

  return (
    <View className={`rounded-2xl overflow-hidden border ${ended ? 'border-zinc-800/40 bg-zinc-900/40' : 'border-zinc-800 bg-zinc-900'}`}>
      <View className="flex-row">
        <View className={`w-[68px] items-center justify-center py-4 gap-0.5 ${ended ? 'bg-zinc-800/20' : 'bg-sky-500/10'}`}>
          <Text className={`text-[10px] font-bold uppercase tracking-wider ${ended ? 'text-zinc-600' : 'text-sky-400'}`}>
            {MONTHS[start.getMonth()]}
          </Text>
          <Text className={`text-[26px] font-bold leading-tight ${ended ? 'text-zinc-600' : 'text-white'}`}>
            {String(start.getDate()).padStart(2, '0')}
          </Text>
          <Text className={`text-[11px] ${ended ? 'text-zinc-700' : 'text-zinc-500'}`}>
            {WEEKDAYS[start.getDay()]}
          </Text>
        </View>

        <View className="flex-1 px-4 py-3 gap-1.5 justify-center">
          <View className="flex-row items-center justify-between">
            <View className="flex-row gap-1.5">
              {dayLabel && !ended && (
                <View style={{ backgroundColor: dayLabel.color + '25' }} className="rounded-md px-2 py-0.5">
                  <Text style={{ color: dayLabel.color }} className="text-xs font-semibold">{dayLabel.text}</Text>
                </View>
              )}
              {ended && (
                <View className="bg-zinc-800 rounded-md px-2 py-0.5">
                  <Text className="text-zinc-500 text-xs">Encerrado</Text>
                </View>
              )}
            </View>
            <Pressable
              className="w-7 h-7 rounded-full bg-zinc-800 items-center justify-center active:bg-red-500/20"
              onPress={() => onDelete(item.id)}
              hitSlop={8}
            >
              <Text className="text-zinc-500 text-sm leading-none">✕</Text>
            </Pressable>
          </View>

          <Text className={`text-base font-semibold leading-snug ${ended ? 'text-zinc-500' : 'text-white'}`} numberOfLines={1}>
            {item.summary}
          </Text>

          {item.description ? (
            <Text className="text-zinc-600 text-sm" numberOfLines={1}>{item.description}</Text>
          ) : null}

          <View className="flex-row items-center gap-1.5">
            <Text className="text-zinc-600 text-xs">🕐</Text>
            <Text className={`text-xs font-medium ${ended ? 'text-zinc-600' : 'text-sky-400'}`}>
              {formatTime(item.startDateTime)}
            </Text>
            <Text className="text-zinc-700 text-xs">→</Text>
            <Text className={`text-xs font-medium ${ended ? 'text-zinc-600' : 'text-sky-400'}`}>
              {formatTime(item.endDateTime)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { bottom } = useSafeAreaInsets();
  const { state, signOut } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;
  const accessToken = state.status === 'authenticated' ? state.accessToken : '';

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (accessToken) loadReminders();
  }, [accessToken]);

  async function loadReminders(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await remindersService.list(accessToken);
      setReminders(data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os lembretes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function addReminder(input: CreateReminderInput) {
    try {
      const created = await remindersService.create(accessToken, input);
      setReminders(prev => [created, ...prev]);
    } catch {
      Alert.alert('Erro', 'Não foi possível criar o lembrete.');
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Excluir lembrete', 'Tem certeza que deseja excluir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await remindersService.remove(accessToken, id);
            setReminders(prev => prev.filter(r => r.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o lembrete.');
          }
        },
      },
    ]);
  }

  function confirmSignOut() {
    Alert.alert('Sair da conta', 'Deseja deslogar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  }

  const today = new Date();
  const todayCount = reminders.filter(r => isSameDay(parseLocalISO(r.startDateTime), today) && !isPast(r.endDateTime)).length;
  const upcoming = reminders.filter(r => !isPast(r.endDateTime));
  const past = reminders.filter(r => isPast(r.endDateTime));


  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable onLongPress={confirmSignOut} hitSlop={4}>
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} className="w-11 h-11 rounded-full" />
              ) : (
                <View className="w-11 h-11 rounded-full bg-sky-500 items-center justify-center">
                  <Text className="text-white text-base font-bold">
                    {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </Pressable>
            <View>
              <Text className="text-zinc-500 text-xs">{getGreeting()},</Text>
              <Text className="text-white text-base font-bold leading-tight">
                {firstName(user?.displayName)}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={confirmSignOut}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center active:opacity-60"
            hitSlop={8}
          >
            <Text className="text-zinc-400 text-base">↪</Text>
          </Pressable>
        </View>

        {!loading && reminders.length > 0 && (
          <View className="flex-row gap-2 mt-4">
            <View className="flex-1 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2.5 gap-0.5">
              <Text className="text-sky-400 text-xl font-bold">{todayCount}</Text>
              <Text className="text-zinc-500 text-xs">hoje</Text>
            </View>
            <View className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 gap-0.5">
              <Text className="text-white text-xl font-bold">{upcoming.length}</Text>
              <Text className="text-zinc-500 text-xs">próximos</Text>
            </View>
            <View className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 gap-0.5">
              <Text className="text-zinc-500 text-xl font-bold">{past.length}</Text>
              <Text className="text-zinc-600 text-xs">encerrados</Text>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="text-zinc-600 text-sm">Carregando...</Text>
        </View>
      ) : reminders.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="w-20 h-20 bg-zinc-900 rounded-3xl items-center justify-center">
            <Text className="text-4xl">🔔</Text>
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-white text-base font-semibold">Nenhum lembrete ainda</Text>
            <Text className="text-zinc-600 text-sm text-center leading-5">
              Toque em + para criar seu primeiro lembrete
            </Text>
          </View>
        </View>
      ) : (
        <SectionList
          sections={[
            ...(upcoming.length > 0 ? [{ key: 'upcoming', title: `Próximos · ${upcoming.length}`, titleClass: 'text-zinc-400', data: upcoming }] : []),
            ...(past.length > 0 ? [{ key: 'past', title: `Encerrados · ${past.length}`, titleClass: 'text-zinc-600', data: past }] : []),
          ]}
          keyExtractor={item => item.id}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottom + 96, paddingTop: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReminders(true)}
              tintColor="#0ea5e9"
              colors={['#0ea5e9']}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text className={`${section.titleClass} text-xs font-semibold uppercase tracking-widest px-0.5 mb-3`}>
              {section.title}
            </Text>
          )}
          renderSectionFooter={() => <View style={{ height: 20 }} />}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12 }}>
              <ReminderCard item={item} onDelete={confirmDelete} />
            </View>
          )}
        />
      )}

      <Pressable
        style={{ bottom: bottom + 16 }}
        className="absolute right-6 w-14 h-14 rounded-2xl bg-sky-500 items-center justify-center shadow-lg active:opacity-80"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white text-3xl leading-none font-light mb-0.5">+</Text>
      </Pressable>

      <AddTaskModal
        visible={modalVisible}
        accessToken={accessToken}
        onAdd={addReminder}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
