import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { api } from '../api/client';

// Show alerts while the app is open too, so an urgent request is never silent.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let registeredToken: string | null = null;

/** Ask permission, get the Expo push token and register it with the API. Never throws: push is optional. */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return; // simulators/web cannot receive push

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('urgent', {
        name: 'Urgent blood requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400],
        lightColor: '#c8101e',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    const status = existing.granted ? existing : await Notifications.requestPermissionsAsync();
    if (!status.granted) return;

    // Needs an EAS project id (set by `eas init`); Expo Go on SDK 53+ cannot fetch remote push tokens.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/api/notifications/subscribe-mobile', { token, platform: Platform.OS });
    registeredToken = token;
  } catch (e) {
    if (__DEV__) console.warn('Push registration skipped:', e);
  }
}

/** Remove this device's token so a signed-out phone stops receiving the previous user's alerts. */
export async function unregisterPush(): Promise<void> {
  const token = registeredToken;
  registeredToken = null;
  if (!token) return;
  try {
    await api.delete('/api/notifications/subscribe-mobile', { data: { token } });
  } catch {
    /* best effort; the server also prunes dead tokens */
  }
}

// The API sends web-style paths in `actionUrl`; translate them to the app's deep links.
const ROUTES: Record<string, string> = {
  '/dashboard/donor-requests': 'requests',
  '/dashboard/hospital-requests': 'hospital-requests',
  '/dashboard/doctor-inbox': 'inbox',
};

/** Open the right screen when the user taps a notification. Returns the unsubscribe function. */
export function listenForNotificationTaps(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((res) => {
    const url = res.notification.request.content.data?.actionUrl as string | undefined;
    const target = url ? ROUTES[url] : undefined;
    void Linking.openURL(`sobda://${target ?? 'alerts'}`);
  });
  return () => sub.remove();
}
