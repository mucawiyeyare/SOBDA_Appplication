import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { colors, MIN_TOUCH, radius } from '../constants/theme';

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const body = <View style={[styles.card, style]}>{children}</View>;
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.85 }}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

const TONES = {
  neutral: { bg: '#e2e8f0', fg: '#334155' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  danger: { bg: '#fee2e2', fg: '#991b1b' },
  info: { bg: '#dbeafe', fg: '#1e40af' },
  brand: { bg: '#fee2e2', fg: colors.brand },
};
export type Tone = keyof typeof TONES;

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const STATUS_TONE: Record<string, Tone> = {
  Pending: 'warning',
  Arrived: 'info',
  Accepted: 'success',
  Completed: 'success',
  Declined: 'danger',
  Cancelled: 'neutral',
  Expired: 'neutral',
  Available: 'success',
  Donated: 'info',
  Unavailable: 'neutral',
  Emergency: 'danger',
  Urgent: 'warning',
  Routine: 'neutral',
};
export const StatusBadge = ({ status }: { status: string }) => <Badge label={status} tone={STATUS_TONE[status] ?? 'neutral'} />;

export function BloodBadge({ type }: { type?: string }) {
  if (!type) return null;
  return (
    <View style={styles.blood}>
      <Text style={styles.bloodText}>{type}</Text>
    </View>
  );
}

export function Avatar({ name, uri, size = 44 }: { name?: string; uri?: string; size?: number }) {
  const initials = (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[box, { backgroundColor: colors.line }]} />;
  return (
    <View style={[box, styles.avatar]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder = 'Search' }: { value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      accessibilityLabel={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="while-editing"
      style={styles.search}
    />
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  allLabel = 'All',
}: {
  options: readonly T[];
  value: T | '';
  onChange: (v: T | '') => void;
  allLabel?: string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ gap: 8 }}>
      {(['' as const, ...options] as (T | '')[]).map((o) => (
        <Pressable
          key={o || 'all'}
          onPress={() => onChange(o)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === o }}
          style={[styles.chip, value === o && styles.chipOn]}>
          <Text style={[styles.chipText, value === o && styles.chipTextOn]}>{o || allLabel}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{String(value)}</Text>
    </View>
  );
}

export function MenuItem({ label, hint, onPress, danger }: { label: string; hint?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.menu, pressed && { backgroundColor: colors.soft }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: colors.danger }]}>{label}</Text>
        {!!hint && <Text style={styles.menuHint}>{hint}</Text>}
      </View>
      <Text style={styles.chev}>{'>'}</Text>
    </Pressable>
  );
}

export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  blood: { minWidth: 38, paddingHorizontal: 8, height: 26, borderRadius: 13, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  bloodText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  avatar: { backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  search: { minHeight: MIN_TOUCH, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, fontSize: 15, backgroundColor: colors.soft, color: colors.text, marginBottom: 10 },
  chips: { flexGrow: 0, marginBottom: 12 },
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', backgroundColor: colors.white },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  chipTextOn: { color: colors.white },
  kv: { marginBottom: 6 },
  kvLabel: { fontSize: 11, fontWeight: '600', color: colors.muted },
  kvValue: { fontSize: 14, color: colors.text },
  menu: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  menuLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  menuHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  chev: { color: colors.muted, fontSize: 18 },
});
