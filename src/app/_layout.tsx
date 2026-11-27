// ⚠️ I polyfill crittografici DEVONO essere importati per primi (prima di GUN).
import '../polyfills';

import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
// WebView invisibile che esegue la WebCrypto per SEA (vedi polyfills.ts).
// Non serve (e non funziona) nel browser.
const PolyfillCrypto =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Platform.OS === 'web' ? () => null : require('react-native-webview-crypto').default;

import { AuthProvider, useAuth } from '../context/AuthContext';
import { PingsProvider } from '../context/PingsContext';
import { SettingsProvider } from '../context/SettingsContext';
import { COLORS } from '../lib/config';

function RootNavigator() {
  const { status } = useAuth();

  // Quando cambia lo stato di login portiamo l'utente alla schermata giusta.
  const prev = useRef(status);
  useEffect(() => {
    if (prev.current === status) return;
    // (dal caricamento iniziale ci pensa la Opening screen in index.tsx)
    if (status === 'signedIn' && prev.current !== 'loading') router.replace('/home');
    else if (status === 'signedOut' && prev.current === 'signedIn') router.replace('/login');
    prev.current = status;
  }, [status]);

  // Tocco su una notifica => apri la lista dei ping (slide 10.1).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const id = resp.notification.request.content.data?.pingId as string | undefined;
      if (status === 'signedIn') router.push(id ? `/ping/${id}` : '/home');
    });
    return () => sub.remove();
  }, [status]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.primary } }}>
      <Stack.Screen name="index" />

      {/* Schermate accessibili solo da loggati */}
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="home" />
        <Stack.Screen name="compose" />
        <Stack.Screen name="contacts" />
        <Stack.Screen name="ping/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="change-password" />
      </Stack.Protected>

      {/* Schermate accessibili solo da NON loggati */}
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="recovery-code" />
        <Stack.Screen name="reset-request" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ height: 0, width: 0, overflow: 'hidden' }}>
        <PolyfillCrypto />
      </View>
      <SettingsProvider>
        <AuthProvider>
          <PingsProvider>
            <RootNavigator />
          </PingsProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
