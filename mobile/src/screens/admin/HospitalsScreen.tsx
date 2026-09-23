import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Badge, Card, Row, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { UserRecord } from '../../types/models';

/** Admin: approve/suspend hospitals. Ministry (health_institution): read-only view with stats. */
export function HospitalsScreen() {
  const qc = useQueryClient();
  const canApprove = useAuthStore((s) => s.user?.role === 'admin');
  const query = useQuery({ queryKey: ['admin', 'hospitals'], queryFn: adminApi.hospitals });

  const setApproval = useMutation({
    mutationFn: ({ id, ok }: { id: string; ok: boolean }) => adminApi.approveHospital(id, ok),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
    onError: (e) => Alert.alert('Action failed', errorMessage(e)),
  });

  const ask = (h: UserRecord, ok: boolean) =>
    Alert.alert(ok ? 'Approve hospital' : 'Suspend hospital', `${ok ? 'Approve' : 'Suspend'} ${h.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: ok ? 'Approve' : 'Suspend', style: ok ? 'default' : 'destructive', onPress: () => setApproval.mutate({ id: h._id, ok }) },
    ]);

  return (
    <Screen>
      <ScreenTitle title="Hospitals" subtitle={query.data ? `${query.data.length} registered` : undefined} />
      <QueryList
        query={query}
        keyExtractor={(h) => h._id}
        emptyTitle="No hospitals yet"
        renderItem={(h) => (
          <Card>
            <View style={styles.top}>
              <Text style={styles.name} numberOfLines={1}>{h.name}</Text>
              <Badge label={h.isApproved ? 'Approved' : 'Pending'} tone={h.isApproved ? 'success' : 'warning'} />
            </View>
            <Row label="Location" value={h.location} />
            <Row label="Phone" value={h.phone} />
            <Row label="License" value={h.hospitalLicense} />
            <View style={styles.stats}>
              <Stat label="Requests" value={h.totalRequests} />
              <Stat label="Active" value={h.activeRequests} />
              <Stat label="Donations" value={h.completedDonations} />
            </View>
            {canApprove && (
              <View style={{ marginTop: 10 }}>
                {h.isApproved ? <Button title="Suspend" variant="danger" onPress={() => ask(h, false)} /> : <Button title="Approve" onPress={() => ask(h, true)} />}
              </View>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}

const Stat = ({ label, value }: { label: string; value?: number }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value ?? 0}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.navy },
  stats: { flexDirection: 'row', gap: 8, marginTop: 8 },
  stat: { flex: 1, backgroundColor: colors.soft, borderRadius: 10, padding: 8, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.navy },
  statLabel: { fontSize: 11, color: colors.muted },
});
