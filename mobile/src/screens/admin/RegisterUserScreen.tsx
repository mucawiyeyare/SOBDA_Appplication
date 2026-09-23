import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { Select } from '../../components/Select';
import { ScreenTitle } from '../../components/ui';
import { BLOOD_TYPES, Role } from '../../types';

const ROLES: Role[] = ['donor', 'hospital', 'doctor', 'health_institution', 'admin'];
const empty = { name: '', email: '', password: '', phone: '', location: '', role: 'donor' as Role, bloodType: '', nationalId: '', gender: '', age: '', hospitalLicense: '' };

/** Admin: create an account of any role (the public sign-up only allows donors and hospitals). */
export function RegisterUserScreen() {
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof empty) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  const create = useMutation({
    mutationFn: () =>
      adminApi.registerUser({
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        password: f.password,
        phone: f.phone.trim(),
        location: f.location.trim(),
        role: f.role,
        bloodType: f.bloodType || undefined,
        nationalId: f.nationalId.trim() || undefined,
        gender: f.gender || undefined,
        age: f.age ? Number(f.age) : undefined,
        hospitalLicense: f.hospitalLicense.trim() || undefined,
      }),
    onSuccess: (res) => {
      Alert.alert('User created', res.message);
      setF(empty);
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => Alert.alert('Could not create user', errorMessage(e)),
  });

  const submit = () => {
    if (!f.name.trim() || !f.email.trim() || !f.phone.trim() || !f.location.trim()) return Alert.alert('Name, email, phone and location are required');
    if (f.password.length < 6) return Alert.alert('Password must be at least 6 characters');
    create.mutate();
  };

  return (
    <Screen scroll hasHeader>
      <ScreenTitle title="Register user" subtitle="Create an account for any role" />
      <Select label="Role" value={f.role} options={ROLES} onChange={(v) => setF((s) => ({ ...s, role: v as Role }))} />
      <Input label="Full name" value={f.name} onChangeText={set('name')} />
      <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Password" value={f.password} onChangeText={set('password')} secureTextEntry />
      <Input label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Input label="Location" value={f.location} onChangeText={set('location')} />
      {f.role === 'donor' && (
        <>
          <Select label="Blood type" value={f.bloodType} options={BLOOD_TYPES} onChange={set('bloodType')} />
          <Select label="Gender" value={f.gender} options={['Male', 'Female', 'Other']} onChange={set('gender')} />
          <Input label="National ID" value={f.nationalId} onChangeText={set('nationalId')} />
          <Input label="Age" value={f.age} onChangeText={set('age')} keyboardType="number-pad" />
        </>
      )}
      {f.role === 'hospital' && <Input label="License number" value={f.hospitalLicense} onChangeText={set('hospitalLicense')} />}
      <Button title="Create user" loading={create.isPending} onPress={submit} />
    </Screen>
  );
}
