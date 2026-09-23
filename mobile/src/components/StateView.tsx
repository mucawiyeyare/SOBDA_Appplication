import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { Button } from './Button';

/** Shared loading / error / empty presentation for every data screen. */
export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>{message}</Text>
      {onRetry && <Button title="Try again" onPress={onRetry} variant="outline" />}
    </View>
  );
}

export function EmptyView({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.body}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.navy, textAlign: 'center' },
  body: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});
