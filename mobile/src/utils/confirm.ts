import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation dialog. React Native's Alert.alert with multiple custom
 * buttons is unreliable in the web build (react-native-web's polyfill), so web uses the
 * browser's native confirm() instead; native platforms use the normal Alert.
 */
export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void, destructive = true) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
