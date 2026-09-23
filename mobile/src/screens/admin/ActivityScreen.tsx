import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Badge, Card, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import { fmtDateTime } from '../../utils/format';

export function ActivityScreen() {
  const query = useQuery({ queryKey: ['admin', 'activity', 'full'], queryFn: () => adminApi.recentActivity(100) });
  return (
    <Screen>
      <ScreenTitle title="Activity log" subtitle="Latest system events" />
      <QueryList
        query={query}
        keyExtractor={(a) => a._id}
        emptyTitle="No activity yet"
        renderItem={(a) => (
          <Card>
            <View style={styles.top}>
              <Text style={styles.action}>{a.action}</Text>
              <Badge label={a.status} tone={a.status === 'success' ? 'success' : 'danger'} />
            </View>
            {!!a.details && <Text style={styles.details}>{a.details}</Text>}
            <Text style={styles.meta}>{a.user?.name ? `${a.user.name} (${a.user.role}) · ` : ''}{fmtDateTime(a.createdAt)}</Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  action: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.navy },
  details: { fontSize: 13, color: colors.text, marginTop: 4 },
  meta: { fontSize: 11, color: colors.muted, marginTop: 6 },
});
