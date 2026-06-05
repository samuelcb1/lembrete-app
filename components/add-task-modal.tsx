import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  onAdd: (title: string) => void;
  onClose: () => void;
};

export function AddTaskModal({ visible, onAdd, onClose }: Props) {
  const [title, setTitle] = useState('');

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
    onClose();
  }

  function handleClose() {
    setTitle('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="bg-zinc-900 rounded-t-2xl p-6 gap-4">
          <Text className="text-white text-lg font-semibold">Nova tarefa</Text>

          <TextInput
            className="bg-zinc-800 text-white rounded-xl px-4 py-3 text-base"
            placeholder="Digite o nome da tarefa..."
            placeholderTextColor="#71717a"
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleAdd}
            autoFocus
            returnKeyType="done"
          />

          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 bg-zinc-800 py-4 rounded-xl items-center"
              onPress={handleClose}
            >
              <Text className="text-zinc-400 font-semibold text-base">Cancelar</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-sky-600 py-4 rounded-xl items-center"
              onPress={handleAdd}
            >
              <Text className="text-white font-semibold text-base">Adicionar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
