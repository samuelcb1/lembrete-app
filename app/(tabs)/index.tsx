import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddTaskModal } from '@/components/add-task-modal';

type Task = {
  id: string;
  title: string;
  done: boolean;
};

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  function addTask(title: string) {
    setTasks(prev => [...prev, { id: Date.now().toString(), title, done: false }]);
  }

  function toggleTask(id: string) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="h-12 bg-black items-center justify-center rounded-b-lg">
        <Text className="text-white text-2xl font-bold">Adicione Seu Lembrete</Text>
      </View>

      <Text className="text-gray-800 text-lg font-semibold px-5 pt-5 pb-2">
        Seus Lembretes
      </Text>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        contentContainerClassName="px-5 gap-3"
        ListEmptyComponent={
          <Text className="text-gray-400 text-center mt-16 text-base">
            Nenhum lembrete ainda. Toque em + para adicionar.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center bg-gray-100 rounded-xl p-4 gap-3"
            onPress={() => toggleTask(item.id)}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 border-sky-600 ${item.done ? 'bg-sky-600' : ''}`}
            />
            <Text
              className={`flex-1 text-base ${item.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}
            >
              {item.title}
            </Text>
          </Pressable>
        )}
      />

      <Pressable
        className="absolute bottom-7 right-6 w-14 h-14 rounded-full bg-sky-600 items-center justify-center shadow-lg"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </Pressable>

      <AddTaskModal
        visible={modalVisible}
        onAdd={addTask}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
