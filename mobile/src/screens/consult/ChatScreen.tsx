import React, { useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { consultApi } from '../../api/public';
import { Button } from '../../components/Button';
import { ErrorView, LoadingView } from '../../components/StateView';
import { colors, radius } from '../../constants/theme';
import type { MainStackParamList } from '../../navigation/types';
import type { ChatMessage } from '../../types/models';
import { useAuthStore } from '../../store/authStore';
import { fmtDateTime } from '../../utils/format';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

/** One chat screen for both sides: a donor talking to a doctor, or a doctor answering a donor. */
export function ChatScreen({ route }: Props) {
  const { peerId } = route.params;
  const role = useAuthStore((s) => s.user?.role);
  const asDoctor = role === 'doctor';
  const qc = useQueryClient();
  const listRef = useRef<FlatList>(null);
  const [text, setText] = useState('');

  const key = ['consult', asDoctor ? 'doctor' : 'donor', peerId];
  const thread = useQuery({
    queryKey: key,
    queryFn: async (): Promise<{ messages: ChatMessage[] }> =>
      asDoctor ? consultApi.doctorThread(peerId) : consultApi.donorThread(peerId),
    refetchInterval: 8000, // simple polling; the backend has no websocket
  });

  const send = useMutation({
    mutationFn: (t: string) => (asDoctor ? consultApi.doctorSend(peerId, t) : consultApi.donorSend(peerId, t)),
    onSuccess: () => {
      setText('');
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ['consult'] });
    },
    onError: (e) => Alert.alert('Message not sent', errorMessage(e)),
  });

  if (thread.isLoading) return <LoadingView />;
  if (thread.isError) return <ErrorView message={thread.error.message} onRetry={() => thread.refetch()} />;

  const mine = asDoctor ? 'doctor' : 'donor';
  const messages = thread.data?.messages ?? [];

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m._id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet. Write your question below.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === mine ? styles.mine : styles.theirs]}>
            <Text style={item.sender === mine ? styles.mineText : styles.theirText}>{item.text}</Text>
            <Text style={[styles.time, item.sender === mine && { color: '#fecaca' }]}>{fmtDateTime(item.createdAt)}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          style={styles.input}
        />
        <View style={{ width: 84 }}>
          <Button title="Send" onPress={() => text.trim() && send.mutate(text.trim())} loading={send.isPending} disabled={!text.trim()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  list: { padding: 14, flexGrow: 1 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  bubble: { maxWidth: '82%', padding: 10, borderRadius: radius.md, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.brand },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.soft },
  mineText: { color: colors.white, fontSize: 15 },
  theirText: { color: colors.text, fontSize: 15 },
  time: { fontSize: 10, color: colors.muted, marginTop: 4 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  input: { flex: 1, maxHeight: 110, minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 15, backgroundColor: colors.soft, color: colors.text },
});
