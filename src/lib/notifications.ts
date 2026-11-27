/**
 * Notifiche.
 *
 * 1) Notifiche LOCALI (sempre): quando GUN consegna un nuovo ping mentre
 *    l'app è aperta o in background, mostriamo una notifica di sistema.
 *    Non serve alcun server: è il telefono stesso a crearla.
 *
 * 2) Notifiche PUSH (facoltative, ENABLE_EXPO_PUSH): per avvisare chi ha
 *    l'app CHIUSA serve per forza il servizio push di Apple/Google.
 *    Usiamo il servizio gratuito di Expo chiamandolo direttamente dal
 *    telefono di chi invia: nessun server nostro. Richiede una development
 *    build (non Expo Go) e un projectId EAS in app.json.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { COLORS, ENABLE_EXPO_PUSH } from './config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pings', {
      name: 'Pings',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: COLORS.primary,
      vibrationPattern: [0, 150, 100, 150],
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function notifyLocal(title: string, body: string, data: Record<string, any> = {}) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: Platform.OS === 'android' ? { channelId: 'pings' } as any : null,
  });
}

/** Ottiene il token push Expo (o null se non disponibile, es. in Expo Go/emulatore). */
export async function getPushToken(): Promise<string | null> {
  if (!ENABLE_EXPO_PUSH || !Device.isDevice) return null;
  const projectId =
    (Constants.expoConfig as any)?.extra?.eas?.projectId || (Constants as any).easConfig?.projectId;
  if (!projectId) return null;
  try {
    const t = await Notifications.getExpoPushTokenAsync({ projectId });
    return t.data;
  } catch {
    return null;
  }
}

/** Invia una push tramite il servizio Expo (chiamato dal telefono del mittente). */
export async function sendExpoPush(to: string, title: string, body: string) {
  if (!ENABLE_EXPO_PUSH) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, title, body, sound: 'default', channelId: 'pings', data: { type: 'ping' } }),
  });
}
