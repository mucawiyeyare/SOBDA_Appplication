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
import { Avatar, Badge, Card, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { Doctor } from '../../types/models';

const blank = { name: '', specialty: '', title: '', bio: '', email: '', password: '' };

export function DoctorsAdminScreen() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'doctors'], queryFn: adminApi.doctors });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
  const reset = () => { setOpen(false); setEditId(null); setF(blank); };

  const save = useMutation({
    mutationFn: () =>
      adminApi.saveDoctor(editId, {
        name: f.name.trim(),
        specialty: f.specialty.trim(),
        title: f.title.trim(),
        bio: f.bio.trim(),
        // Optional login account so the doctor can answer donors in the chat.
        ...(f.email.trim() && f.password ? { account: { email: f.email.trim().toLowerCase(), password: f.password } } : {}),
      }),
    onSuccess: () => { reset(); void refresh(); },
    onError: (e) => Alert.alert('Could not save', errorMessage(e)),
  });
  const del = useMutation({ mutationFn: (id: string) => adminApi.deleteDoctor(id), onSuccess: refresh, onError: (e) => Alert.alert('Could not delete', errorMessage(e)) });

  return (
    <Screen>
      <ScreenTitle title="Doctors" right={<View style={{ width: 110 }}><Button title="Add" onPress={() => setOpen(true)} /></View>} />
      <QueryList
        query={query}
        keyExtractor={(d) => d._id}
        emptyTitle="No doctors yet"
        renderItem={(d: Doctor) => (
          <Card>
            <View style={styles.row}>
              <Avatar name={d.name} uri={d.photo || undefined} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{d.name}</Text>
                <Text style={styles.spec}>{d.specialty}</Text>
              </View>
              <Badge label={d.canChat ? 'Can chat' : 'Profile only'} tone={d.canChat ? 'success' : 'neutral'} />
            </View>
            <View style={[styles.row, { marginTop: 10, gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <Button title="Edit" variant="outline" onPress={() => { setEditId(d._id); setF({ ...blank, name: d.name, specialty: d.specialty, title: d.title ?? '', bio: d.bio ?? '' }); setOpen(true); }} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Delete" variant="danger" onPress={() => Alert.alert('Delete doctor', `Remove ${d.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => del.mutate(d._id) }])} />
              </View>
            </View>
          </Card>
        )}
      />
      <FormSheet visible={open} onClose={reset} title={editId ? 'Edit doctor' : 'Add doctor'}>
        <Input label="Name" value={f.name} onChangeText={set('name')} />
        <Input label="Specialty" value={f.specialty} onChangeText={set('specialty')} />
        <Input label="Title (optional)" value={f.title} onChangeText={set('title')} />
        <Input label="Bio (optional)" value={f.bio} onChangeText={set('bio')} multiline />
        {!editId && (
          <>
            <Input label="Login email (optional, enables chat)" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Login password" value={f.password} onChangeText={set('password')} secureTextEntry />
          </>
        )}
        <Button
          title="Save doctor"
          loading={save.isPending}
          onPress={() => (f.name.trim() && f.specialty.trim() ? save.mutate() : Alert.alert('Name and specialty are required'))}
        />
      </FormSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 15, fontWeight: '700', color: colors.navy },
  spec: { fontSize: 13, color: colors.brand, fontWeight: '600' },
});
