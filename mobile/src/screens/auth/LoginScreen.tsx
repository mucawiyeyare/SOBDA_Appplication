import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { errorMessage } from '../../api/client';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { LoginForm, loginSchema } from '../../utils/validation';

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setServerError('');
    try {
      await login(email, password); // navigator switches to Main when the store gets a user
    } catch (e) {
      setServerError(errorMessage(e));
    }
  });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Image source={require('../../../assets/logo-mark.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>SOBDA</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
      </View>

      {!!serverError && <Text style={styles.serverError}>{serverError}</Text>}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            ref={passwordRef}
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        )}
      />

      <Button title="Sign in" onPress={onSubmit} loading={isSubmitting} />

      <Pressable onPress={() => navigation.navigate('Register')} style={styles.link} accessibilityRole="link">
        <Text style={styles.linkText}>
          New here? <Text style={styles.linkStrong}>Create an account</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginVertical: 32 },
  logo: { width: 84, height: 84, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 4 },
  serverError: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13,
  },
  link: { alignItems: 'center', minHeight: 48, justifyContent: 'center', marginTop: 12 },
  linkText: { color: colors.muted, fontSize: 14 },
  linkStrong: { color: colors.brand, fontWeight: '700' },
});
