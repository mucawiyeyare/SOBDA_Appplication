import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../constants/theme';
import type { MainStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';
import { confirmAction } from '../utils/confirm';

const ROLE_LABEL: Record<Role, string> = {
  donor: 'Blood donor',
  hospital: 'Hospital',
  admin: 'Administrator',
  health_institution: 'Ministry of Health',
  doctor: 'Doctor',
};

interface Props {
  /** Overrides the role label under the name, e.g. "System overview". */
  subtitle?: string;
}

/**
 * Dark identity banner shown at the top of each role's main dashboard tab.
 * Tapping the avatar/name opens the profile screen; the icon on the right signs out in one tap
 * (with a confirmation) so logout is never buried behind a scroll.
 */
export function DashboardHeader({ subtitle }: Props) {
  const nav = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { user, logout } = useAuthStore();
  if (!user) return null;

  const firstName = user.name.split(' ')[0] || user.name;
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const confirmLogout = () =>
    confirmAction('Sign out', 'Are you sure you want to sign out?', 'Sign out', () => void logout());

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => nav.navigate('Profile')}
        style={styles.left}
        accessibilityRole="button"
        accessibilityLabel="Open my profile">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.hello} numberOfLines={1}>Hi, {firstName}</Text>
          <Text style={styles.role} numberOfLines={1}>{subtitle ?? ROLE_LABEL[user.role]}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={confirmLogout}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        hitSlop={12}
        style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}>
        <Ionicons name="log-out-outline" size={22} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 },
  flex: { flex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  hello: { fontSize: 17, fontWeight: '800', color: colors.white },
  role: { fontSize: 12, color: '#cbd5e1', marginTop: 2, fontWeight: '600' },
  logout: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
