import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorMessage } from '../../api/client';
import { requestsApi } from '../../api/requests';
import { Button } from '../../components/Button';
import { FormSheet } from '../../components/FormSheet';
import { Input } from '../../components/Input';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { BloodBadge, Card, Chips, Row, ScreenTitle, StatusBadge } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { DonorRequest, RequestStatus } from '../../types/models';
import { fmtCountdown, fmtDateTime, useCountdown } from '../../utils/format';

const STATUSES: RequestStatus[] = ['Pending', 'Accepted', 'Arrived', 'Completed', 'Declined', 'Expired', 'Cancelled'];

export function HospitalRequestsScreen() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [completing, setCompleting] = useState<DonorRequest | null>(null);
  const [volume, setVolume] = useState('450');
  const [notes, setNotes] = useState('');

  const query = useQuery({ queryKey: ['hospital', 'requests', status], queryFn: () => requestsApi.hospitalRequests(status || undefined), refetchInterval: 30_000 });
  const done = () => qc.invalidateQueries({ queryKey: ['hospital'] });
  const onError = (e: unknown) => Alert.alert('Action failed', errorMessage(e));

  const arrived = useMutation({ mutationFn: (id: string) => requestsApi.markArrived(id), onSuccess: done, onError });
  const cancel = useMutation({ mutationFn: (id: string) => requestsApi.cancel(id), onSuccess: done, onError });
  const complete = useMutation({
    mutationFn: () => requestsApi.markCompleted(completing!._id, { volume: Number(volume), notes: notes.trim() }),
    onSuccess: () => {
      setCompleting(null);
      setNotes('');
      void done();
    },
    onError,
  });

  const confirmCancel = (r: DonorRequest) =>
    Alert.alert('Cancel request', `Cancel the request to ${r.donorId?.name ?? 'this donor'}?`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => cancel.mutate(r._id) },
    ]);

  return (
    <Screen>
      <ScreenTitle title="Requests" subtitle="Track requests you sent" />
      <Chips options={STATUSES} value={status} onChange={setStatus} />
      <QueryList
        query={query}
        keyExtractor={(r) => r._id}
        emptyTitle="No requests"
        emptyMessage="Requests you send to donors are tracked here."
        renderItem={(r) => (
          <Item req={r} onArrived={() => arrived.mutate(r._id)} onComplete={() => setCompleting(r)} onCancel={() => confirmCancel(r)} />
        )}
      />
      <FormSheet visible={!!completing} onClose={() => setCompleting(null)} title="Record donation">
        <Text style={styles.for}>Donor: {completing?.donorId?.name}</Text>
        <Input label="Volume (ml)" value={volume} onChangeText={setVolume} keyboardType="number-pad" />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
        <Button
          title="Mark donation completed"
          loading={complete.isPending}
          onPress={() => {
            const v = Number(volume);
            if (!v || v < 50 || v > 1000) return Alert.alert('Enter a volume between 50 and 1000 ml');
            complete.mutate();
          }}
        />
      </FormSheet>
    </Screen>
  );
}

const Item = React.memo(function Item({ req, onArrived, onComplete, onCancel }: { req: DonorRequest; onArrived: () => void; onComplete: () => void; onCancel: () => void }) {
  const left = useCountdown(req.status === 'Pending' ? req.pendingUntil : undefined);
  const d = req.donorId;
  const open = ['Pending', 'Accepted', 'Arrived'].includes(req.status);
  return (
    <Card>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>{d?.name ?? 'Donor'}</Text>
        <StatusBadge status={req.status} />
      </View>
      <View style={styles.tags}>
        <BloodBadge type={req.bloodType} />
        <StatusBadge status={req.urgency} />
      </View>
      <Row label="Patient" value={req.patientInfo?.name} />
      <Row label="Diagnosis" value={req.patientInfo?.diagnosis} />
      <Row label="Donor location" value={d?.location} />
      {req.status === 'Accepted' && <Row label="Donor arriving" value={req.availabilityTime} />}
      {req.status === 'Declined' && <Row label="Decline reason" value={req.declineReason} />}
      <Row label="Sent" value={fmtDateTime(req.requestDate)} />
      {req.status === 'Pending' && <Text style={styles.timer}>{left > 0 ? `${fmtCountdown(left)} left to respond` : 'Window closed'}</Text>}
      {open && (
        <View style={styles.actions}>
          {d?.phone && <View style={styles.flex}><Button title="Call" variant="outline" onPress={() => Linking.openURL(`tel:${d.phone}`)} /></View>}
          {req.status === 'Accepted' && <View style={styles.flex}><Button title="Arrived" onPress={onArrived} /></View>}
          {req.status === 'Arrived' && <View style={styles.flex}><Button title="Complete" onPress={onComplete} /></View>}
          <View style={styles.flex}><Button title="Cancel" variant="danger" onPress={onCancel} /></View>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.navy },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  timer: { fontSize: 13, fontWeight: '700', color: colors.warning, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  flex: { flexGrow: 1, minWidth: 90 },
  for: { fontSize: 14, color: colors.muted, marginBottom: 12 },
});
