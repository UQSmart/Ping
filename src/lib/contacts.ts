/**
 * Rubrica: legge i contatti del telefono e scopre chi ha Ping!
 *
 * Per ogni numero cerchiamo nel grafo GUN l'alias "ping-app-v1:+39...".
 * Se esiste otteniamo la chiave pubblica (pub) dell'amico.
 * Il risultato è messo in cache sul telefono per non ripetere la ricerca.
 */
import { Contact, ContactField, requestPermissionsAsync } from 'expo-contacts';
import { Platform } from 'react-native';
import { normalizePhone } from './phone';
import { pubForPhone } from './auth';
import { loadContactCache, saveContactCache } from './storage';

export type AppContact = {
  key: string;
  name: string;
  phone: string;
  pub: string | null; // null = non ha ancora Ping! (=> invito WhatsApp)
};

const RECHECK_MISSING_MS = 6 * 3600 * 1000;

export async function loadPhoneContacts(): Promise<{ name: string; phone: string }[]> {
  if (Platform.OS === 'web') return []; // nel browser non c'è la rubrica
  let all: unknown[];
  try {
    const perm = await requestPermissionsAsync();
    if (!perm.granted) return [];
    all = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES] as const);
  } catch {
    return [];
  }
  const byPhone = new Map<string, string>();
  for (const c of all as any[]) {
    const name: string = c.fullName || 'Unknown';
    for (const ph of c.phones ?? []) {
      const n = normalizePhone(ph.number ?? '');
      if (n && !byPhone.has(n)) byPhone.set(n, name);
    }
  }
  return [...byPhone].map(([phone, name]) => ({ phone, name }));
}

/** Associa a ogni contatto la sua pub GUN (se ha l'app), con concorrenza limitata. */
export async function resolveContacts(
  list: { name: string; phone: string }[],
  myPhone: string,
  onProgress?: (partial: AppContact[]) => void,
): Promise<AppContact[]> {
  const cache = await loadContactCache();
  const out: AppContact[] = [];
  const queue = list.filter((c) => c.phone !== myPhone);
  const now = Date.now();

  async function worker() {
    while (queue.length) {
      const c = queue.shift()!;
      const hit = cache[c.phone];
      let pub: string | null;
      if (hit && (hit.pub || now - hit.checkedAt < RECHECK_MISSING_MS)) {
        pub = hit.pub;
      } else {
        pub = await pubForPhone(c.phone, 2500);
        cache[c.phone] = { pub, checkedAt: Date.now() };
      }
      out.push({ key: c.phone, name: c.name, phone: c.phone, pub });
      if (out.length % 10 === 0) onProgress?.([...out]);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  await saveContactCache(cache);
  return out;
}
