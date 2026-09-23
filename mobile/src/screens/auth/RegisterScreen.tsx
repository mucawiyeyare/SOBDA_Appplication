import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/auth';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { Select } from '../../components/Select';
import { SOMALIA_REGIONS } from '../../constants/somaliaLocations';
import { colors, radius } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { BLOOD_TYPES } from '../../types';
import { DonorForm, donorSchema, HospitalForm, hospitalSchema } from '../../utils/validation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type Kind = 'donor' | 'hospital';

const REGIONS = Object.keys(SOMALIA_REGIONS);

export function RegisterScreen({ navigation }: Props) {
  const [kind, setKind] = useState<Kind>('donor');
  const [pendingMessage, setPendingMessage] = useState('');

  if (pendingMessage) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Registration submitted</Text>
          <Text style={styles.pending}>{pendingMessage}</Text>
          <Button title="Back to sign in" onPress={() => navigation.navigate('Login')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={styles.title}>Create your account</Text>
      <View style={styles.tabs}>
        {(['donor', 'hospital'] as Kind[]).map((k) => (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: kind === k }}
            onPress={() => setKind(k)}
            style={[styles.tab, kind === k && styles.tabActive]}>
            <Text style={[styles.tabText, kind === k && styles.tabTextActive]}>
              {k === 'donor' ? 'Blood donor' : 'Hospital'}
            </Text>
          </Pressable>
        ))}
      </View>

      {kind === 'donor' ? <DonorFormView /> : <HospitalFormView onPending={setPendingMessage} />}

      <Pressable onPress={() => navigation.navigate('Login')} style={styles.link} accessibilityRole="link">
        <Text style={styles.linkText}>
          Already registered? <Text style={styles.linkStrong}>Sign in</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

function DonorFormView() {
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState('');
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DonorForm>({
    resolver: zodResolver(donorSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', region: '', district: '', nationalId: '', age: '' },
  });
  const region = watch('region');

  const onSubmit = handleSubmit(async (d) => {
    setServerError('');
    try {
      const res = await authApi.register({
        role: 'donor',
        nationalId: d.nationalId.trim(),
        gender: d.gender,
        name: d.name.trim(),
        email: d.email.trim().toLowerCase(),
        password: d.password,
        phone: d.phone.trim(),
        location: `${d.district}, ${d.region}`,
        bloodType: d.bloodType as (typeof BLOOD_TYPES)[number],
        age: d.age ? Number(d.age) : undefined,
      });
      if (!res.token) throw new Error('Registration succeeded but no session was returned. Please sign in.');
      await setSession(res.token, res.user);
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  return (
    <View>
      {!!serverError && <Text style={styles.serverError}>{serverError}</Text>}
      <Field control={control} name="name" label="Full name" error={errors.name?.message} autoComplete="name" />
      <Field control={control} name="nationalId" label="Government / National ID" error={errors.nationalId?.message} />
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <Select
            label="Gender"
            value={field.value ?? ''}
            options={['Male', 'Female']}
            onChange={field.onChange}
            error={errors.gender?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="bloodType"
        render={({ field }) => (
          <Select
            label="Blood type"
            value={field.value ?? ''}
            options={BLOOD_TYPES}
            onChange={field.onChange}
            error={errors.bloodType?.message}
          />
        )}
      />
      <Field control={control} name="age" label="Age (optional)" error={errors.age?.message} keyboardType="number-pad" />
      <Field control={control} name="phone" label="Phone" error={errors.phone?.message} keyboardType="phone-pad" autoComplete="tel" />
      <Controller
        control={control}
        name="region"
        render={({ field }) => (
          <Select
            label="Region"
            value={field.value}
            options={REGIONS}
            onChange={(v) => {
              field.onChange(v);
              setValue('district', '');
            }}
            error={errors.region?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="district"
        render={({ field }) => (
          <Select
            label="District"
            value={field.value}
            options={SOMALIA_REGIONS[region] ?? []}
            onChange={field.onChange}
            disabled={!region}
            error={errors.district?.message}
          />
        )}
      />
      <Field
        control={control}
        name="email"
        label="Email"
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field control={control} name="password" label="Password" error={errors.password?.message} secureTextEntry autoComplete="new-password" />
      <Button title="Register as donor" onPress={onSubmit} loading={isSubmitting} />
    </View>
  );
}

function HospitalFormView({ onPending }: { onPending: (msg: string) => void }) {
  const [serverError, setServerError] = useState('');
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HospitalForm>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: { name: '', email: '', password: '', phone: '', region: '', district: '', hospitalLicense: '', road: '' },
  });
  const region = watch('region');

  const onSubmit = handleSubmit(async (d) => {
    setServerError('');
    try {
      const res = await authApi.register({
        role: 'hospital',
        name: d.name.trim(),
        email: d.email.trim().toLowerCase(),
        password: d.password,
        phone: d.phone.trim(),
        location: [d.road?.trim(), d.district, d.region].filter(Boolean).join(', '),
        hospitalLicense: d.hospitalLicense?.trim() || undefined,
      });
      // Hospitals need admin approval, so the server returns no token.
      onPending(res.message);
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  return (
    <View>
      {!!serverError && <Text style={styles.serverError}>{serverError}</Text>}
      <Field control={control} name="name" label="Hospital name" error={errors.name?.message} />
      <Field control={control} name="hospitalLicense" label="License number (optional)" error={errors.hospitalLicense?.message} />
      <Field control={control} name="phone" label="Emergency phone" error={errors.phone?.message} keyboardType="phone-pad" />
      <Controller
        control={control}
        name="region"
        render={({ field }) => (
          <Select
            label="Region"
            value={field.value}
            options={REGIONS}
            onChange={(v) => {
              field.onChange(v);
              setValue('district', '');
            }}
            error={errors.region?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="district"
        render={({ field }) => (
          <Select
            label="District"
            value={field.value}
            options={SOMALIA_REGIONS[region] ?? []}
            onChange={field.onChange}
            disabled={!region}
            error={errors.district?.message}
          />
        )}
      />
      <Field control={control} name="road" label="Road / street (optional)" error={errors.road?.message} />
      <Field
        control={control}
        name="email"
        label="Official email"
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field control={control} name="password" label="Password" error={errors.password?.message} secureTextEntry autoComplete="new-password" />
      <Button title="Submit for approval" onPress={onSubmit} loading={isSubmitting} />
    </View>
  );
}

// Small typed wrapper so each form field is one line instead of a Controller block.
function Field({
  control,
  name,
  label,
  error,
  ...rest
}: {
  control: any;
  name: string;
  label: string;
  error?: string;
} & Omit<React.ComponentProps<typeof Input>, 'label' | 'error' | 'value' | 'onChangeText'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <Input label={label} value={value ?? ''} onChangeText={onChange} onBlur={onBlur} error={error} {...rest} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.navy, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: colors.soft, borderRadius: radius.md, padding: 4, marginBottom: 18 },
  tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.white },
  tabText: { color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.brand, fontWeight: '700' },
  serverError: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13,
  },
  center: { flex: 1, justifyContent: 'center', gap: 16 },
  pending: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  link: { alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: 12 },
  linkText: { color: colors.muted, fontSize: 14 },
  linkStrong: { color: colors.brand, fontWeight: '700' },
});
