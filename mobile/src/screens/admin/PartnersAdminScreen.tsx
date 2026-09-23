import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { FormSheet } from '../../components/FormSheet';
import { Input } from '../../components/Input';
import { QueryList } from '../../components/QueryList';
import { Screen } from '../../components/Screen';
import { Card, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import type { Partner } from '../../types/models';

export function PartnersAdminScreen() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['admin', 'partners'], queryFn: adminApi.partners });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [logo, setLogo] = useState('');

  const reset = () => {
    setOpen(false);
    setEditId(null);
    setName('');
    setUrl('');
    setLogo('');
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'partners'] });

  const save = useMutation({
    mutationFn: () => adminApi.savePartner(editId, { name: name.trim(), websiteUrl: url.trim(), logo }),
    onSuccess: () => {
      reset();
      void refresh();
    },
    onError: (e) => Alert.alert('Could not save', errorMessage(e)),
  });
  const del = useMutation({ mutationFn: (id: string) => adminApi.deletePartner(id), onSuccess: refresh, onError: (e) => Alert.alert('Could not delete', errorMessage(e)) });

  const pickLogo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to choose a logo.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled) return;
    const small = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 400 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.PNG, base64: true });
    if (small.base64) setLogo(`data:image/png;base64,${small.base64}`);
  };

  const submit = () => {
    if (!name.trim() || !url.trim() || !logo) return Alert.alert('Name, website and logo are required');
    save.mutate();
  };

  return (
    <Screen>
      <ScreenTitle title="Partners" right={<View style={{ width: 110 }}><Button title="Add" onPress={() => setOpen(true)} /></View>} />
      <QueryList
        query={query}
        keyExtractor={(p) => p._id}
        emptyTitle="No partners yet"
        renderItem={(p: Partner) => (
          <Card>
            <View style={styles.row}>
              <Image source={{ uri: p.logo }} style={styles.logo} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.url} numberOfLines={1}>{p.websiteUrl}</Text>
              </View>
            </View>
            <View style={[styles.row, { marginTop: 10, gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <Button title="Edit" variant="outline" onPress={() => { setEditId(p._id); setName(p.name); setUrl(p.websiteUrl); setLogo(p.logo); setOpen(true); }} />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="Delete" variant="danger" onPress={() => Alert.alert('Delete partner', `Remove ${p.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => del.mutate(p._id) }])} />
              </View>
            </View>
          </Card>
        )}
      />
      <FormSheet visible={open} onClose={reset} title={editId ? 'Edit partner' : 'Add partner'}>
        <Input label="Partner name" value={name} onChangeText={setName} />
        <Input label="Website URL" value={url} onChangeText={setUrl} autoCapitalize="none" keyboardType="url" placeholder="https://" />
        {!!logo && <Image source={{ uri: logo }} style={styles.preview} resizeMode="contain" />}
        <View style={{ gap: 10 }}>
          <Button title={logo ? 'Change logo' : 'Choose logo'} variant="outline" onPress={pickLogo} />
          <Button title="Save partner" loading={save.isPending} onPress={submit} />
        </View>
      </FormSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 56, height: 56, backgroundColor: colors.soft, borderRadius: 8 },
  name: { fontSize: 15, fontWeight: '700', color: colors.navy },
  url: { fontSize: 12, color: colors.muted },
  preview: { width: '100%', height: 90, marginBottom: 12, backgroundColor: colors.soft, borderRadius: 8 },
});
