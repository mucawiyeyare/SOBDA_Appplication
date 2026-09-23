import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Screen } from '../../components/Screen';
import { ErrorView, LoadingView } from '../../components/StateView';
import { Card, ScreenTitle } from '../../components/ui';
import { colors, radius } from '../../constants/theme';

const LABELS: Record<string, string> = {
  totalDonors: 'Donors',
  activeDonors: 'Active donors',
  availableDonors: 'Available',
  cooldownDonors: 'In cooldown',
  totalHospitals: 'Hospitals',
  totalRequests: 'Requests',
  pendingRequests: 'Pending',
  arrivedRequests: 'Arrived',
  completedRequests: 'Completed',
  cancelledRequests: 'Cancelled',
  totalDonations: 'Donations',
  patientsSaved: 'Patients saved',
};

/** Compact mobile version of the web Reports page: key numbers, urgency mix and monthly trend. */
export function ReportsScreen() {
  const q = useQuery({ queryKey: ['reports', 'overview'], queryFn: adminApi.reportOverview });
  if (q.isLoading) return <Screen><LoadingView /></Screen>;
  if (q.isError) return <Screen><ErrorView message={q.error.message} onRetry={() => q.refetch()} /></Screen>;

  const { summary, urgencyCounts, monthlyDonations } = q.data!;
  const max = Math.max(1, ...(monthlyDonations ?? []).map((m) => m.count));

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brand} />} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="Reports" subtitle="System overview" />
        <View style={styles.grid}>
          {Object.entries(LABELS).map(([k, label]) =>
            summary[k] === undefined ? null : (
              <View key={k} style={styles.tile}>
                <Text style={styles.value}>{summary[k]}</Text>
                <Text style={styles.label}>{label}</Text>
              </View>
            ),
          )}
        </View>

        {urgencyCounts && (
          <Card>
            <Text style={styles.h}>Requests by urgency</Text>
            {Object.entries(urgencyCounts).map(([k, v]) => (
              <View key={k} style={styles.line}>
                <Text style={styles.lineLabel}>{k}</Text>
                <Text style={styles.lineValue}>{v}</Text>
              </View>
            ))}
          </Card>
        )}

        {!!monthlyDonations?.length && (
          <Card>
            <Text style={styles.h}>Donations per month</Text>
            {monthlyDonations.map((m) => (
              <View key={m.month} style={styles.barRow}>
                <Text style={styles.barLabel}>{m.month}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(m.count / max) * 100}%` }]} />
                </View>
                <Text style={styles.barValue}>{m.count}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  tile: { flexGrow: 1, flexBasis: '30%', backgroundColor: colors.soft, borderRadius: radius.md, padding: 12 },
  value: { fontSize: 22, fontWeight: '800', color: colors.navy },
  label: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  h: { fontSize: 15, fontWeight: '700', color: colors.navy, marginBottom: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  lineLabel: { color: colors.text },
  lineValue: { fontWeight: '700', color: colors.navy },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  barLabel: { width: 52, fontSize: 11, color: colors.muted },
  track: { flex: 1, height: 10, backgroundColor: colors.soft, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, backgroundColor: colors.brand, borderRadius: 5 },
  barValue: { width: 28, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.navy },
});
