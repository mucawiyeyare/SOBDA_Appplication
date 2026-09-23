import React from 'react';
import { Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Avatar, MenuItem, ScreenTitle } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';

type Item = { label: string; hint?: string; to: keyof MainStackParamList };

const ITEMS: Partial<Record<Role, Item[]>> = {
  hospital: [
    { label: 'Nearest donors', hint: 'Find donors close to you', to: 'NearestDonors' },
    { label: 'Reports', hint: 'Donation and request summaries', to: 'Reports' },
  ],
  admin: [
    { label: 'Donors', hint: 'Browse and request donors', to: 'Donors' },
    { label: 'Nearest donors', to: 'NearestDonors' },
    { label: 'Reports', hint: 'System overview', to: 'Reports' },
    { label: 'Activity log', to: 'Activity' },
    { label: 'Contact messages', to: 'Messages' },
    { label: 'Partners', to: 'Partners' },
    { label: 'Doctors', to: 'DoctorsAdmin' },
    { label: 'Register user', hint: 'Create an account for any role', to: 'RegisterUser' },
  ],
  health_institution: [
    { label: 'Donors', to: 'Donors' },
    { label: 'Activity log', to: 'Activity' },
  ],
};

export function MoreScreen() {
  const nav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user, logout } = useAuthStore();
  const items = (user && ITEMS[user.role]) ?? [];
  return (
    <Screen scroll>
      <ScreenTitle title={user?.name ?? 'More'} subtitle={user?.email} right={<Avatar name={user?.name} />} />
      {items.map((i) => (
        <MenuItem key={i.to} label={i.label} hint={i.hint} onPress={() => nav.navigate(i.to as never)} />
      ))}
      <MenuItem label="My profile" hint="Edit details, photo and password" onPress={() => nav.navigate('Profile')} />
      <MenuItem
        label="Sign out"
        danger
        onPress={() =>
          Alert.alert('Sign out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
          ])
        }
      />
      <Text />
    </Screen>
  );
}
