import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { Avatar, BloodBadge, Card, Chips, Row, ScreenTitle, SearchBar, StatusBadge, useDebounced } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { BLOOD_TYPES, BloodType } from '../../types';
import type { DonorRow, DonorStatus, Urgency } from '../../types/models';
import { fmtDate, fmtCountdown } from '../../utils/format';

const STATUS: DonorStatus[] = ['Available', 'Pending', 'Arrived', 'Donated', 'Unavailable'];
const URGENCIES: Urgency[] = ['Routine', 'Urgent', 'Emergency'];

/** Hospital/admin: browse donors, filter, and send a request to one donor or to a selected group. */
export function HospitalDonorsScreen() {
  const qc = useQueryClient();
  // The Ministry can view donors but only hospitals/admins may send requests (enforced by the API too).
  const readOnly = useAuthStore((s) => s.user?.role === 'health_institution');
  const [search, setSearch] = useState('');
  const [blood, setBlood] = useState<BloodType | ''>('');
  const [status, setStatus] = useState<DonorStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<DonorRow[] | null>(null);
  const q = useDebounced(search);

  const query = useQuery({
    queryKey: ['hospital', 'donors', q, blood, status],
    queryFn: () => requestsApi.donors({ search: q, bloodType: blood, status }),
  });

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectedRows = (query.data ?? []).filter((d) => selected.has(d._id));

  const header = (
    <View>
      <DashboardHeader />
      <ScreenTitle title="Donors" subtitle="Find and request blood donors" />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, phone, location" />
      <Chips options={BLOOD_TYPES} value={blood} onChange={setBlood} allLabel="All types" />
      <Chips options={STATUS} value={status} onChange={setStatus} allLabel="Any status" />
    </View>
  );

  return (
    <Screen>
      <QueryList
        query={query}
        header={header}
        keyExtractor={(d) => d._id}
        emptyTitle="No donors found"
        emptyMessage="Try changing the search or filters."
        renderItem={(d) => (
          <DonorCard d={d} checked={selected.has(d._id)} onToggle={() => toggle(d._id)} onRequest={() => setTarget([d])} readOnly={readOnly} />
        )}
      />
      {selectedRows.length > 0 && (
        <View style={styles.bar}>
          <Text style={styles.barText}>{selectedRows.length} selected</Text>
          <View style={{ width: 150 }}>
            <Button title="Send request" onPress={() => setTarget(selectedRows)} />
          </View>
        </View>
      )}
      <RequestSheet
        donors={target}
        onClose={() => setTarget(null)}
        onSent={() => {
          setTarget(null);
          setSelected(new Set());
          void qc.invalidateQueries({ queryKey: ['hospital'] });
        }}
      />
    </Screen>
  );
}

const DonorCard = React.memo(function DonorCard({ d, checked, onToggle, onRequest, readOnly }: { d: DonorRow; checked: boolean; onToggle: () => void; onRequest: () => void; readOnly: boolean }) {
  const canAsk = d.status === 'Available' && !readOnly;
  return (
    <Card style={checked ? styles.checked : undefined}>
      <Pressable onPress={canAsk ? onToggle : undefined} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: !canAsk }}>
        <View style={styles.row}>
          <Avatar name={d.name} />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>{d.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>{d.location}</Text>
          </View>
          <BloodBadge type={d.bloodType} />
        </View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <StatusBadge status={d.status} />
          {d.status === 'Donated' && <Text style={styles.sub}>Available again {fmtDate(d.cooldownEndsAt)}</Text>}
          {d.status === 'Pending' && !!d.remainingSeconds && <Text style={styles.sub}>{fmtCountdown(d.remainingSeconds)} left</Text>}
        </View>
      </Pressable>
      <Row label="Gender / Age" value={[d.gender, d.age].filter(Boolean).join(' / ')} />
      <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
        {!readOnly && (
          <View style={styles.flex}>
            <Button title="Request" onPress={onRequest} disabled={!canAsk} />
          </View>
        )}
        <View style={styles.flex}>
          <Button title="Call" variant="outline" onPress={() => Linking.openURL(`tel:${d.phone}`)} />
        </View>
      </View>
    </Card>
  );
});

function RequestSheet({ donors, onClose, onSent }: { donors: DonorRow[] | null; onClose: () => void; onSent: () => void }) {
  const [urgency, setUrgency] = useState<Urgency>('Urgent');
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [message, setMessage] = useState('');
  const [p, setP] = useState({ name: '', age: '', phone: '', diagnosis: '', causeOfInjury: '', notes: '' });
  const batch = (donors?.length ?? 0) > 1;
  const first = donors?.[0];
  const type = (bloodType || first?.bloodType || '') as BloodType | '';

  const send = useMutation({
    mutationFn: async () => {
      if (!donors || !type) throw new Error('Choose the blood type needed.');
      if (batch) return requestsApi.createBatch({ donorIds: donors.map((d) => d._id), bloodType: type, urgency, message: message.trim() || undefined });
      if (!p.name.trim() || !p.diagnosis.trim()) throw new Error('Patient name and diagnosis are required.');
      return requestsApi.create({
        donorId: donors[0]._id,
        bloodType: type,
        urgency,
        message: message.trim() || undefined,
        patientInfo: {
          name: p.name.trim(),
          age: p.age ? Number(p.age) : undefined,
          phone: p.phone.trim() || undefined,
          diagnosis: p.diagnosis.trim(),
          causeOfInjury: p.causeOfInjury.trim() || undefined,
          notes: p.notes.trim() || undefined,
        },
      });
    },
    onSuccess: (res) => {
      Alert.alert('Request sent', res.message);
      setP({ name: '', age: '', phone: '', diagnosis: '', causeOfInjury: '', notes: '' });
      setMessage('');
      onSent();
    },
    onError: (e) => Alert.alert('Could not send request', errorMessage(e)),
  });

  return (
    <FormSheet visible={!!donors} onClose={onClose} title={batch ? `Request ${donors?.length} donors` : `Request ${first?.name ?? ''}`}>
      <Select label="Blood type needed" value={type} options={BLOOD_TYPES} onChange={(v) => setBloodType(v as BloodType)} />
      <Select label="Urgency" value={urgency} options={URGENCIES} onChange={(v) => setUrgency(v as Urgency)} />
      {!batch && (
        <>
          <Input label="Patient name" value={p.name} onChangeText={(v) => setP({ ...p, name: v })} />
          <Input label="Patient age" value={p.age} onChangeText={(v) => setP({ ...p, age: v })} keyboardType="number-pad" />
          <Input label="Patient phone" value={p.phone} onChangeText={(v) => setP({ ...p, phone: v })} keyboardType="phone-pad" />
          <Input label="Diagnosis" value={p.diagnosis} onChangeText={(v) => setP({ ...p, diagnosis: v })} />
          <Input label="Cause of injury (optional)" value={p.causeOfInjury} onChangeText={(v) => setP({ ...p, causeOfInjury: v })} />
          <Input label="Notes (optional)" value={p.notes} onChangeText={(v) => setP({ ...p, notes: v })} multiline />
        </>
      )}
      <Input label="Message to donor (optional)" value={message} onChangeText={setMessage} multiline />
      <Button title={batch ? 'Send to all selected' : 'Send request'} loading={send.isPending} onPress={() => send.mutate()} />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.navy },
  sub: { fontSize: 12, color: colors.muted },
  checked: { borderColor: colors.brand, borderWidth: 2 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
  barText: { fontWeight: '700', color: colors.navy },
});
