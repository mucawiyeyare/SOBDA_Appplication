import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { FormSheet } from '../../components/FormSheet';
import { Input } from '../../components/Input';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Select } from '../../components/Select';
import { Avatar, Badge, BloodBadge, Card, Chips, Row, ScreenTitle, SearchBar, useDebounced } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';
import type { UserRecord } from '../../types/models';

const ROLES: Role[] = ['donor', 'hospital', 'doctor', 'health_institution', 'admin'];

export function UsersScreen() {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [role, setRole] = useState<Role | ''>('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', role: 'donor' as Role });
  const q = useDebounced(search).trim().toLowerCase();

  const query = useQuery({ queryKey: ['admin', 'users', role], queryFn: () => adminApi.users(role || undefined) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });

  const save = useMutation({
    mutationFn: () => adminApi.updateUser(editing!._id, form),
    onSuccess: () => {
      setEditing(null);
      void refresh();
    },
    onError: (e) => Alert.alert('Could not save', errorMessage(e)),
  });
  const del = useMutation({ mutationFn: (id: string) => adminApi.deleteUser(id), onSuccess: refresh, onError: (e) => Alert.alert('Could not delete', errorMessage(e)) });

  const open = (u: UserRecord) => {
    setForm({ name: u.name, email: u.email, phone: u.phone, location: u.location, role: u.role });
    setEditing(u);
  };
  const confirmDelete = (u: UserRecord) =>
    Alert.alert('Delete user', `Permanently delete ${u.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(u._id) },
    ]);

  const filter = (u: UserRecord) => !q || [u.name, u.email, u.phone, u.location].some((f) => f?.toLowerCase().includes(q));

  return (
    <Screen>
      <ScreenTitle title="Users" subtitle={query.data ? `${query.data.length} accounts` : undefined} />
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search name, email, phone" />
      <Chips options={ROLES} value={role} onChange={setRole} allLabel="All roles" />
      <QueryList
        query={query}
        filter={filter}
        keyExtractor={(u) => u._id}
        emptyTitle="No users found"
        renderItem={(u) => (
          <Card>
            <View style={styles.row}>
              <Avatar name={u.name} />
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>{u.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{u.email}</Text>
              </View>
              <BloodBadge type={u.role === 'donor' ? u.bloodType : undefined} />
            </View>
            <View style={[styles.row, { marginVertical: 8 }]}>
              <Badge label={u.role.replace('_', ' ')} tone="info" />
              {u.role === 'hospital' && <Badge label={u.isApproved ? 'Approved' : 'Pending approval'} tone={u.isApproved ? 'success' : 'warning'} />}
            </View>
            <Row label="Phone" value={u.phone} />
            <Row label="Location" value={u.location} />
            <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
              <View style={styles.flex}><Button title="Edit" variant="outline" onPress={() => open(u)} /></View>
              {u._id !== me?.id && <View style={styles.flex}><Button title="Delete" variant="danger" onPress={() => confirmDelete(u)} /></View>}
            </View>
          </Card>
        )}
      />
      <FormSheet visible={!!editing} onClose={() => setEditing(null)} title="Edit user">
        <Input label="Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Input label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Input label="Location" value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} />
        <Select label="Role" value={form.role} options={ROLES} onChange={(v) => setForm({ ...form, role: v as Role })} />
        <Button title="Save changes" loading={save.isPending} onPress={() => save.mutate()} />
      </FormSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.navy },
  sub: { fontSize: 12, color: colors.muted },
});
