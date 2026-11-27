/**
 * Dati salvati SOLO sul telefono (nessun server).
 *  - SecureStore (cifrato dal sistema operativo): la chiave crittografica
 *    dell'utente, per restare loggati.
 *  - AsyncStorage: impostazioni, ping salvati, contatti recenti, cache.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const K = {
  session: 'ping.session',
  settings: 'ping.settings',
  saved: 'ping.savedPings',
  recents: 'ping.recents',
  contactCache: 'ping.contactCache',
};

export type Session = { pair: any; phone: string };

// Nel browser SecureStore non esiste: usiamo AsyncStorage (solo per sviluppo).
const isWeb = Platform.OS === 'web';
export async function saveSession(s: Session) {
  const v = JSON.stringify(s);
  if (isWeb) await AsyncStorage.setItem(K.session, v);
  else await SecureStore.setItemAsync(K.session, v);
}
export async function loadSession(): Promise<Session | null> {
  const v = isWeb ? await AsyncStorage.getItem(K.session) : await SecureStore.getItemAsync(K.session);
  return v ? JSON.parse(v) : null;
}
export async function clearSession() {
  if (isWeb) await AsyncStorage.removeItem(K.session);
  else await SecureStore.deleteItemAsync(K.session);
}

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
const setJSON = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v));

/* ---------- Impostazioni (slide 9.1: salvate localmente) ---------- */
export type Settings = {
  sound: boolean;
  notifications: boolean;
  blocked: string[]; // pub key degli utenti bloccati
};
export const DEFAULT_SETTINGS: Settings = { sound: true, notifications: true, blocked: [] };
export const loadSettings = async () => ({ ...DEFAULT_SETTINGS, ...(await getJSON(K.settings, {})) });
export const saveSettings = (s: Settings) => setJSON(K.settings, s);

/* ---------- Ping salvati dall'utente (slide 3: "possibilità di salvare") ---------- */
export type SavedPing = {
  id: string;
  fromPub: string;
  fromName: string;
  text: string;
  links: Record<string, string>;
  ts: number;
};
export const loadSavedPings = () => getJSON<SavedPing[]>(K.saved, []);
export async function savePingLocally(p: SavedPing) {
  const all = await loadSavedPings();
  if (!all.find((x) => x.id === p.id)) all.unshift(p);
  await setJSON(K.saved, all);
}
export async function deleteSavedPing(id: string) {
  const all = await loadSavedPings();
  await setJSON(K.saved, all.filter((x) => x.id !== id));
}

/* ---------- Recenti: pub -> timestamp dell'ultimo ping inviato ---------- */
export const loadRecents = () => getJSON<Record<string, number>>(K.recents, {});
export async function touchRecent(pub: string) {
  const r = await loadRecents();
  r[pub] = Date.now();
  await setJSON(K.recents, r);
}

/* ---------- Cache rubrica: numero -> pub (null = non ha Ping!) ---------- */
export type ContactCache = Record<string, { pub: string | null; checkedAt: number }>;
export const loadContactCache = () => getJSON<ContactCache>(K.contactCache, {});
export const saveContactCache = (c: ContactCache) => setJSON(K.contactCache, c);
