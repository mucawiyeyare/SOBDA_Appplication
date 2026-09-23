import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';
import { accountApi } from '../../api/account';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { FormSheet } from '../../components/FormSheet';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { ErrorView, LoadingView } from '../../components/StateView';
import { Avatar, Card, Row, ScreenTitle } from '../../components/ui';
import { colors } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export function ProfileScreen() {
  const nav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user, updateUser, logout } = useAuthStore();
  const profile = useQuery({ queryKey: ['profile'], queryFn: accountApi.profile });
  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', location: '', age: '' });

  useEffect(() => {
    if (profile.data) {
      setForm({
        name: profile.data.name ?? '',
        phone: profile.data.phone ?? '',
        location: profile.data.location ?? '',
        age: profile.data.age ? String(profile.data.age) : '',
      });
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: (body: Parameters<typeof accountApi.updateProfile>[0]) => accountApi.updateProfile(body),
    onSuccess: async (res) => {
      await updateUser({ name: res.user.name, phone: res.user.phone, location: res.user.location, allowPublicLeaderboard: res.user.allowPublicLeaderboard });
      void profile.refetch();
      setEditing(false);
    },
    onError: (e) => Alert.alert('Could not save', errorMessage(e)),
  });

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access in Settings to choose a profile picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (res.canceled) return;
    // Shrink before upload: the API stores the photo as a base64 string in the user document.
    const small = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 320 } }], {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (small.base64) save.mutate({ profileImage: `data:image/jpeg;base64,${small.base64}` });
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access in Settings to take a profile picture.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 });
    if (res.canceled) return;
    const small = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 320 } }], {
      compress: 0.6,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (small.base64) save.mutate({ profileImage: `data:image/jpeg;base64,${small.base64}` });
  };

  const changePhoto = () =>
    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: () => void takePhoto() },
      { text: 'Choose from library', onPress: () => void pickPhoto() },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const confirmLogout = () =>
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
    ]);

  if (profile.isLoading) return <Screen><LoadingView /></Screen>;
  if (profile.isError) return <Screen><ErrorView message={profile.error.message} onRetry={() => profile.refetch()} /></Screen>;
  const p = profile.data!;
  const isDonor = p.role === 'donor';

  return (
    <Screen scroll>
      <ScreenTitle title="Profile" />
      <View style={styles.center}>
        <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Change profile photo">
          <Avatar name={p.name} uri={p.profileImage} size={92} />
        </Pressable>
        <Text style={styles.link} onPress={changePhoto}>Change photo</Text>
        <Text style={styles.name}>{p.name}</Text>
        <Text style={styles.role}>{p.role.replace('_', ' ')}</Text>
      </View>

      <Card>
        <Row label="Email" value={p.email} />
        <Row label="Phone" value={p.phone} />
        <Row label="Location" value={p.location} />
        {isDonor && <Row label="Blood type" value={p.bloodType} />}
        {isDonor && <Row label="Gender" value={p.gender} />}
        {isDonor && <Row label="Age" value={p.age} />}
        {isDonor && <Row label="National ID" value={p.nationalId} />}
        {p.role === 'hospital' && <Row label="License" value={p.hospitalLicense} />}
      </Card>

      {isDonor && (
        <Card style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Show me on the public leaderboard</Text>
            <Text style={styles.switchHint}>Only your first name and last initial are shown.</Text>
          </View>
          <Switch
            value={p.allowPublicLeaderboard !== false}
            onValueChange={(v) => save.mutate({ allowPublicLeaderboard: v })}
            trackColor={{ true: colors.brand }}
          />
        </Card>
      )}

      <View style={{ gap: 10, marginTop: 8 }}>
        {isDonor && <Button title="My location (GPS)" variant="outline" onPress={() => nav.navigate('Location')} />}
        <Button title="Edit profile" variant="outline" onPress={() => setEditing(true)} />
        <Button title="Change password" variant="outline" onPress={() => setPwOpen(true)} />
        <Button title="Sign out" variant="danger" onPress={confirmLogout} />
      </View>
      <Text style={styles.ver}>Signed in as {user?.email}</Text>

      <FormSheet visible={editing} onClose={() => setEditing(false)} title="Edit profile">
        <Input label="Full name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Input label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        <Input label="Location" value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} />
        {isDonor && <Input label="Age" value={form.age} onChangeText={(v) => setForm({ ...form, age: v })} keyboardType="number-pad" />}
        <Button
          title="Save changes"
          loading={save.isPending}
          onPress={() => {
            if (form.name.trim().length < 2) return Alert.alert('Name is required');
            if (form.phone.trim().length < 7) return Alert.alert('Enter a valid phone number');
            save.mutate({ name: form.name, phone: form.phone, location: form.location, age: form.age ? Number(form.age) : undefined });
          }}
        />
      </FormSheet>

      <PasswordSheet visible={pwOpen} onClose={() => setPwOpen(false)} />
    </Screen>
  );
}

function PasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const change = useMutation({
    mutationFn: () => accountApi.changePassword(cur, next),
    onSuccess: () => {
      setCur('');
      setNext('');
      setConfirm('');
      onClose();
      Alert.alert('Password changed');
    },
    onError: (e) => Alert.alert('Could not change password', errorMessage(e)),
  });
  const submit = () => {
    if (next.length < 6) return Alert.alert('New password must be at least 6 characters');
    if (next !== confirm) return Alert.alert('Passwords do not match');
    change.mutate();
  };
  return (
    <FormSheet visible={visible} onClose={onClose} title="Change password">
      <Input label="Current password" value={cur} onChangeText={setCur} secureTextEntry />
      <Input label="New password" value={next} onChangeText={setNext} secureTextEntry />
      <Input label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button title="Update password" loading={change.isPending} onPress={submit} />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginBottom: 16, gap: 4 },
  link: { color: colors.brand, fontWeight: '700', fontSize: 13, marginTop: 6 },
  name: { fontSize: 20, fontWeight: '800', color: colors.navy, marginTop: 6 },
  role: { fontSize: 13, color: colors.muted, textTransform: 'capitalize' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  switchHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  ver: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 16 },
});
