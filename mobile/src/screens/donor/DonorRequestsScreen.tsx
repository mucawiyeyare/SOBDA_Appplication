import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { requestsApi } from '../../api/requests';
import { Button } from '../../components/Button';
import { DashboardHeader } from '../../components/DashboardHeader';
import { FormSheet } from '../../components/FormSheet';
import { Input } from '../../components/Input';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Select } from '../../components/Select';
import { BloodBadge, Card, Chips, Row, ScreenTitle, StatusBadge } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { DonorRequest, RequestStatus } from '../../types/models';
import { fmtCountdown, fmtDateTime, useCountdown } from '../../utils/format';

const STATUSES: RequestStatus[] = ['Pending', 'Accepted', 'Arrived', 'Completed', 'Expired', 'Declined'];
const TIMES = ['Immediately', 'Within 30 minutes', 'Within 1 hour', 'Within 2 hours'];

export function DonorRequestsScreen() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [active, setActive] = useState<{ req: DonorRequest; mode: 'accept' | 'decline' } | null>(null);
  const [time, setTime] = useState(TIMES[0]);
  const [reason, setReason] = useState('');

  const query = useQuery({ queryKey: ['donor', 'requests', status], queryFn: () => requestsApi.donorRequests(status || undefined) });

  const respond = useMutation({
    mutationFn: () =>
      requestsApi.respond(active!.req._id, {
        response: active!.mode,
        availabilityTime: active!.mode === 'accept' ? time : undefined,
        declineReason: active!.mode === 'decline' ? reason.trim() || undefined : undefined,
      }),
    onSuccess: () => {
      setActive(null);
      setReason('');
      void qc.invalidateQueries({ queryKey: ['donor'] });
    },
    onError: (e) => Alert.alert('Could not send response', errorMessage(e)),
  });

  return (
    <Screen>
      <DashboardHeader />
      <ScreenTitle title="Blood requests" subtitle="Hospitals asking for your help" />
      <Chips options={STATUSES} value={status} onChange={setStatus} allLabel="All" />
      <QueryList
        query={query}
        keyExtractor={(r) => r._id}
        emptyTitle="No requests"
        emptyMessage="When a hospital needs your blood type you will see it here."
        renderItem={(r) => <RequestCard req={r} onAccept={() => setActive({ req: r, mode: 'accept' })} onDecline={() => setActive({ req: r, mode: 'decline' })} />}
      />

      <FormSheet visible={!!active} onClose={() => setActive(null)} title={active?.mode === 'accept' ? 'Accept request' : 'Decline request'}>
        {active?.mode === 'accept' ? (
          <Select label="When can you arrive?" value={time} options={TIMES} onChange={setTime} />
        ) : (
          <Input label="Reason (optional)" value={reason} onChangeText={setReason} placeholder="Unavailable at this time" multiline />
        )}
        <Button
          title={active?.mode === 'accept' ? 'Confirm accept' : 'Confirm decline'}
          variant={active?.mode === 'accept' ? 'primary' : 'danger'}
          loading={respond.isPending}
          onPress={() => respond.mutate()}
        />
      </FormSheet>
    </Screen>
  );
}

const RequestCard = React.memo(function RequestCard({ req, onAccept, onDecline }: { req: DonorRequest; onAccept: () => void; onDecline: () => void }) {
  const left = useCountdown(req.status === 'Pending' ? req.pendingUntil : undefined);
  const canRespond = req.status === 'Pending' && left > 0;
  return (
    <Card>
      <View style={styles.top}>
        <Text style={styles.hospital} numberOfLines={1}>{req.hospitalId?.name ?? 'Hospital'}</Text>
        <StatusBadge status={req.status} />
      </View>
      <View style={styles.tags}>
        <BloodBadge type={req.bloodType} />
        <StatusBadge status={req.urgency} />
      </View>
      <Row label="Location" value={req.hospitalId?.location} />
      <Row label="Diagnosis" value={req.patientInfo?.diagnosis} />
      <Row label="Message" value={req.message} />
      <Row label="Requested" value={fmtDateTime(req.requestDate)} />
      {req.status === 'Accepted' && <Row label="You will arrive" value={req.availabilityTime} />}
      {req.status === 'Declined' && <Row label="Reason" value={req.declineReason} />}
      {req.status === 'Pending' && (
        <Text style={[styles.timer, left === 0 && { color: colors.danger }]}>
          {left > 0 ? `Respond within ${fmtCountdown(left)}` : 'Response window closed'}
        </Text>
      )}
      {canRespond && (
        <View style={styles.actions}>
          <View style={{ flex: 1 }}><Button title="Accept" onPress={onAccept} /></View>
          <View style={{ flex: 1 }}><Button title="Decline" variant="outline" onPress={onDecline} /></View>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  hospital: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.navy },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  timer: { fontSize: 13, fontWeight: '700', color: colors.warning, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
