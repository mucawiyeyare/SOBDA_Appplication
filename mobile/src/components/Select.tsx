import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, MIN_TOUCH, radius } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

/** Cross-platform picker: a field that opens a bottom-sheet style list. */
export function Select({ label, value, options, onChange, placeholder = 'Select...', error, disabled }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, !!error && styles.fieldError, disabled && { opacity: 0.5 }]}>
        <Text style={value ? styles.value : styles.placeholder}>{value || placeholder}</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o}
            renderItem={({ item }) => (
              <Pressable
                style={styles.option}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}>
                <Text style={[styles.optionText, item === value && styles.optionActive]}>{item}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 6 },
  field: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  fieldError: { borderColor: colors.danger },
  value: { fontSize: 16, color: colors.text },
  placeholder: { fontSize: 16, color: colors.muted },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.navy, textAlign: 'center', marginBottom: 8 },
  option: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 20 },
  optionText: { fontSize: 16, color: colors.text },
  optionActive: { color: colors.brand, fontWeight: '700' },
});
