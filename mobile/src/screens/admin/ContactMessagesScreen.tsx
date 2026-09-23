import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Badge, Card, Row, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import { fmtDateTime } from '../../utils/format';

export function ContactMessagesScreen() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'contact'], queryFn: adminApi.contactMessages });
  const del = useMutation({
    mutationFn: (id: string) => adminApi.deleteContactMessage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'contact'] }),
    onError: (e) => Alert.alert('Could not delete', errorMessage(e)),
  });
  return (
    <Screen>
      <ScreenTitle title="Messages" subtitle="From the contact form" />
      <QueryList
        query={query}
        keyExtractor={(m) => m._id}
        emptyTitle="No messages"
        renderItem={(m) => (
          <Card>
            <View style={styles.top}>
              <Text style={styles.subject}>{m.subject}</Text>
              {m.urgency ? <Badge label={m.urgency} tone={m.urgency.toLowerCase().includes('urgent') ? 'danger' : 'neutral'} /> : null}
            </View>
            <Text style={styles.body}>{m.message}</Text>
            <Row label="From" value={`${m.fullName} · ${m.email}`} />
            <Row label="Phone" value={m.phone} />
            <Row label="Received" value={fmtDateTime(m.createdAt)} />
            <View style={styles.actions}>
              <View style={{ flex: 1 }}><Button title="Reply" variant="outline" onPress={() => Linking.openURL(`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`)} /></View>
              <View style={{ flex: 1 }}>
                <Button title="Delete" variant="danger" onPress={() => Alert.alert('Delete message', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => del.mutate(m._id) }])} />
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  subject: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.navy },
  body: { fontSize: 14, color: colors.text, marginBottom: 8, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
