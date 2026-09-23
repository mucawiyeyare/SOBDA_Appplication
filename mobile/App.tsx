import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfflineBanner } from './src/components/OfflineBanner';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { listenForNotificationTaps, registerForPush } from './src/services/push';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const signedIn = useAuthStore((s) => !!s.user);
  useEffect(() => {
    if (!signedIn) return;
    void registerForPush();
    return listenForNotificationTaps();
  }, [signedIn]);

  // Drop cached server data whenever the session ends so the next user never sees it.
  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.user && !state.user) queryClient.clear();
      }),
    [],
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <OfflineBanner />
        <RootNavigator />
        <StatusBar style="dark" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
