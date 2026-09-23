import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../api/requests';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { BloodBadge, Card, Row, ScreenTitle } from '../../components/ui';
import { colors, radius } from '../../constants/theme';
import type { Donation } from '../../types/models';
import { fmtDate } from '../../utils/format';

export function DonorHistoryScreen() {
  const stats = useQuery({ queryKey: ['donor', 'stats'], queryFn: requestsApi.myStats });
  const history = useQuery({ queryKey: ['donor', 'donations'], queryFn: requestsApi.donorDonations });

  const header = (
    <View>
      <ScreenTitle title="My donations" subtitle="Your impact" />
      <View style={styles.hero}>
        <Text style={styles.big}>{stats.data?.livesHelped ?? '-'}</Text>
        <Text style={styles.heroLabel}>lives helped</Text>
      </View>
      <View style={styles.grid}>
        <Mini label="Pending" value={stats.data?.totalPending} />
        <Mini label="Arrived" value={stats.data?.totalArrived} />
        <Mini label="Declined" value={stats.data?.totalDeclined} />
      </View>
      <Text style={styles.section}>History</Text>
    </View>
  );

  return (
    <Screen>
      <QueryList
        query={history}
        header={header}
        keyExtractor={(d) => d._id}
        emptyTitle="No donations yet"
        emptyMessage="Completed donations will appear here."
        renderItem={(d) => <DonationCard d={d} />}
      />
    </Screen>
  );
}

const Mini = ({ label, value }: { label: string; value?: number }) => (
  <View style={styles.mini}>
    <Text style={styles.miniValue}>{value ?? '-'}</Text>
    <Text style={styles.miniLabel}>{label}</Text>
  </View>
);

const DonationCard = React.memo(function DonationCard({ d }: { d: Donation }) {
  const hospital = typeof d.hospitalId === 'object' && d.hospitalId ? d.hospitalId : null;
  return (
    <Card>
      <View style={styles.row}>
        <Text style={styles.hospital}>{hospital?.name ?? 'Hospital'}</Text>
        <BloodBadge type={d.bloodType} />
      </View>
      <Row label="Date" value={fmtDate(d.donationDate)} />
      <Row label="Type" value={d.donationType} />
      <Row label="Volume" value={d.volume ? `${d.volume} ml` : undefined} />
      <Row label="Location" value={hospital?.location} />
    </Card>
  );
});

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, borderRadius: radius.lg, padding: 20, alignItems: 'center', marginBottom: 12 },
  big: { fontSize: 44, fontWeight: '900', color: colors.white },
  heroLabel: { color: '#fecaca', fontWeight: '700' },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  mini: { flex: 1, backgroundColor: colors.soft, borderRadius: radius.md, padding: 12, alignItems: 'center' },
  miniValue: { fontSize: 20, fontWeight: '800', color: colors.navy },
  miniLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  section: { fontSize: 16, fontWeight: '700', color: colors.navy, marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  hospital: { fontSize: 15, fontWeight: '700', color: colors.navy, flex: 1 },
});
