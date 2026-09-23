import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { consultApi, publicApi } from '../../api/public';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Avatar, Badge, Card, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { MainStackParamList } from '../../navigation/types';
import type { Doctor } from '../../types/models';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/** Donor view: doctors who can answer questions, with unread reply counts. */
export function AskDoctorScreen() {
  const nav = useNavigation<Nav>();
  const doctors = useQuery({ queryKey: ['doctors'], queryFn: publicApi.doctors });
  const threads = useQuery({ queryKey: ['consult', 'threads'], queryFn: consultApi.donorThreads, refetchInterval: 30_000 });
  const unread = new Map((threads.data ?? []).map((t) => [t.doctorId, t.unread]));

  return (
    <Screen>
      <ScreenTitle title="Ask a doctor" subtitle="Get health advice before you donate" />
      <QueryList
        query={doctors}
        keyExtractor={(d) => d._id}
        emptyTitle="No doctors available"
        renderItem={(d: Doctor) => (
          <Card onPress={d.canChat ? () => nav.navigate('Chat', { peerId: d._id, title: d.name }) : undefined}>
            <View style={styles.row}>
              <Avatar name={d.name} uri={d.photo || undefined} size={52} />
              <View style={styles.flex}>
                <Text style={styles.name}>{d.name}</Text>
                <Text style={styles.spec}>{d.specialty}</Text>
                {!!d.title && <Text style={styles.title}>{d.title}</Text>}
              </View>
              {(unread.get(d._id) ?? 0) > 0 ? <Badge tone="brand" label={`${unread.get(d._id)} new`} /> : !d.canChat ? <Badge label="Profile only" /> : null}
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.navy },
  spec: { fontSize: 13, color: colors.brand, fontWeight: '600' },
  title: { fontSize: 12, color: colors.muted },
});
