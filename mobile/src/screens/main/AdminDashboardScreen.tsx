import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { adminApi, ActivityItem } from '../../api/admin';
import { Screen } from '../../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import { colors, radius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function AdminDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats });
  const activity = useQuery({ queryKey: ['admin', 'activity'], queryFn: () => adminApi.recentActivity(20) });

  const refreshing = stats.isRefetching || activity.isRefetching;
  const refresh = () => {
    void stats.refetch();
    void activity.refetch();
  };

  if (stats.isLoading) return <Screen><LoadingView /></Screen>;
  if (stats.isError) {
    return (
      <Screen>
        <ErrorView message={stats.error.message} onRetry={refresh} />
      </Screen>
    );
  }

  const s = stats.data!;
  const cards: { icon: IconName; label: string; value: number }[] = [
    { icon: 'people', label: 'Total users', value: s.totalUsers },
    { icon: 'water', label: 'Donors', value: s.totalDonors },
    { icon: 'business', label: 'Hospitals', value: s.totalHospitals },
    { icon: 'heart', label: 'Donations', value: s.totalDonations },
    { icon: 'alert-circle', label: 'Active requests', value: s.activeRequests },
  ];

  return (
    <Screen>
      <FlatList
        data={activity.data ?? []}
        keyExtractor={(a) => a._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.hello}>Hello, {user?.name}</Text>
            <Text style={styles.sub}>System overview</Text>
            <View style={styles.grid}>
              {cards.map((c) => (
                <View key={c.label} style={styles.card}>
                  <Ionicons name={c.icon} size={22} color={colors.brand} />
                  <Text style={styles.value}>{c.value}</Text>
                  <Text style={styles.label}>{c.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.section}>Recent activity</Text>
            {activity.isLoading && <LoadingView />}
            {activity.isError && <ErrorView message={activity.error.message} onRetry={() => activity.refetch()} />}
          </View>
        }
        ListEmptyComponent={
          activity.isLoading || activity.isError ? null : <EmptyView title="No activity yet" />
        }
        renderItem={({ item }) => <ActivityRow item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const ActivityRow = React.memo(function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, item.status === 'success' ? styles.ok : styles.bad]} />
      <View style={styles.flex}>
        <Text style={styles.action}>{item.action}</Text>
        {!!item.details && <Text style={styles.details} numberOfLines={2}>{item.details}</Text>}
        <Text style={styles.meta}>
          {item.user?.name ? `${item.user.name} · ` : ''}
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hello: { fontSize: 22, fontWeight: '800', color: colors.navy },
  sub: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    padding: 16,
    gap: 4,
  },
  value: { fontSize: 28, fontWeight: '800', color: colors.text },
  label: { fontSize: 12, fontWeight: '600', color: colors.muted },
  section: { fontSize: 16, fontWeight: '700', color: colors.navy, marginTop: 24, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  ok: { backgroundColor: colors.success },
  bad: { backgroundColor: colors.danger },
  action: { fontSize: 14, fontWeight: '600', color: colors.text },
  details: { fontSize: 13, color: colors.muted, marginTop: 2 },
  meta: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
