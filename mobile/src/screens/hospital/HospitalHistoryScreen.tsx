import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../api/requests';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { BloodBadge, Card, Row, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { Donation } from '../../types/models';
import { fmtDate } from '../../utils/format';

export function HospitalHistoryScreen() {
  const query = useQuery({ queryKey: ['hospital', 'donations'], queryFn: requestsApi.hospitalDonations });
  return (
    <Screen>
      <ScreenTitle title="Donation history" subtitle={query.data ? `${query.data.length} donations recorded` : undefined} />
      <QueryList
        query={query}
        keyExtractor={(d) => d._id}
        emptyTitle="No donations yet"
        emptyMessage="Completed donations will be listed here."
        renderItem={(d: Donation) => {
          const donor = typeof d.donorId === 'object' ? d.donorId : null;
          return (
            <Card>
              <View style={styles.row}>
                <Text style={styles.name}>{donor?.name ?? 'Donor'}</Text>
                <BloodBadge type={d.bloodType ?? donor?.bloodType} />
              </View>
              <Row label="Date" value={fmtDate(d.donationDate)} />
              <Row label="Volume" value={d.volume ? `${d.volume} ml` : undefined} />
              <Row label="Type" value={d.donationType} />
              <Row label="Donor location" value={donor?.location} />
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.navy },
});
