import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, MIN_TOUCH, radius } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger';
}

export function Button({ title, onPress, loading, disabled, variant = 'primary' }: Props) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'outline' && styles.outline,
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.brand : colors.white} />
      ) : (
        <Text style={[styles.label, variant === 'outline' && styles.outlineLabel]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.brand },
  danger: { backgroundColor: colors.danger },
  outline: { borderWidth: 1.5, borderColor: colors.brand, backgroundColor: 'transparent' },
  inactive: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
  label: { color: colors.white, fontSize: 16, fontWeight: '700' },
  outlineLabel: { color: colors.brand },
});
