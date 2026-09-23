import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountApi, notificationsApi } from '../../api/account';
import { errorMessage } from '../../api/client';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Card, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { AppNotification } from '../../types/models';
import { fmtDateTime } from '../../utils/format';

void accountApi;

export function NotificationsScreen() {
  const qc = useQueryClient();
  const raw = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list(50), refetchInterval: 60_000 });
  // QueryList expects an array result, so adapt the wrapped payload.
  const query = { ...raw, data: raw.data?.notifications } as typeof raw & { data: AppNotification[] | undefined };

  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const markAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh, onError: (e) => Alert.alert('Error', errorMessage(e)) });
  const markOne = useMutation({ mutationFn: (id: string) => notificationsApi.markRead(id), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: string) => notificationsApi.remove(id), onSuccess: refresh, onError: (e) => Alert.alert('Error', errorMessage(e)) });

  const unread = raw.data?.unreadCount ?? 0;

  return (
    <Screen>
      <ScreenTitle
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You are all caught up'}
        right={
          unread > 0 ? (
            <Pressable onPress={() => markAll.mutate()} accessibilityRole="button" hitSlop={10}>
              <Text style={styles.link}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <QueryList
        query={query as never}
        keyExtractor={(n: AppNotification) => n._id}
        emptyTitle="No notifications"
        renderItem={(n: AppNotification) => (
          <Card onPress={() => !n.isRead && markOne.mutate(n._id)} style={!n.isRead ? styles.unread : undefined}>
            <View style={styles.head}>
              <Text style={styles.title}>{n.title}</Text>
              <Pressable
                hitSlop={10}
                accessibilityLabel="Delete notification"
                onPress={() => Alert.alert('Delete', 'Remove this notification?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(n._id) }])}>
                <Text style={styles.del}>Delete</Text>
              </Pressable>
            </View>
            <Text style={styles.msg}>{n.message}</Text>
            <Text style={styles.time}>{fmtDateTime(n.createdAt)}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.brand, fontWeight: '700', fontSize: 13 },
  unread: { borderColor: colors.brand, backgroundColor: '#fff5f5' },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.navy },
  del: { color: colors.muted, fontSize: 12 },
  msg: { fontSize: 13, color: colors.text, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: colors.muted, marginTop: 6 },
});
