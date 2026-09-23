import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { consultApi } from '../../api/public';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Avatar, Badge, BloodBadge, Card, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { MainStackParamList } from '../../navigation/types';
import type { Thread } from '../../types/models';
import { fmtDateTime } from '../../utils/format';

export function DoctorInboxScreen() {
  const nav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const inbox = useQuery({ queryKey: ['consult', 'inbox'], queryFn: consultApi.doctorInbox, refetchInterval: 20_000 });
  return (
    <Screen>
      <ScreenTitle title="Donor questions" subtitle="Answer donors' health questions" />
      <QueryList
        query={inbox}
        keyExtractor={(t: Thread) => String(t.donorId)}
        emptyTitle="No questions yet"
        emptyMessage="Donor messages will appear here."
        renderItem={(t: Thread) => (
          <Card onPress={() => nav.navigate('Chat', { peerId: String(t.donorId), title: t.donor?.name ?? 'Donor' })}>
            <View style={styles.row}>
              <Avatar name={t.donor?.name} uri={t.donor?.profileImage} />
              <View style={styles.flex}>
                <View style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>{t.donor?.name}</Text>
                  <BloodBadge type={t.donor?.bloodType} />
                </View>
                <Text style={styles.msg} numberOfLines={1}>{t.lastMessage.text}</Text>
                <Text style={styles.time}>{fmtDateTime(t.lastMessage.createdAt)}</Text>
              </View>
              {t.unread > 0 && <Badge tone="brand" label={String(t.unread)} />}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.navy, flexShrink: 1 },
  msg: { fontSize: 13, color: colors.text, marginTop: 2 },
  time: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
