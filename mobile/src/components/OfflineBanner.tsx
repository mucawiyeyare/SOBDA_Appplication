import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { colors } from '../constants/theme';

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetInfo();
  if (isConnected !== false && isInternetReachable !== false) return null;
  return <Text style={styles.banner}>You are offline. Some features may not work.</Text>;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    color: colors.white,
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
  },
});
