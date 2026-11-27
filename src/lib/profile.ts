/**
 * Profilo utente nel grafo GUN:  ~<pub>/profile = { name, phone, dob, avatar, lastSeen, pushToken }
 * Leggibile da tutti (serve per mostrare nome e foto a chi riceve un ping),
 * scrivibile solo dal proprietario (firma SEA). La data di nascita è cifrata.
 */
import { gun, user, SEA, clean, onceAsync, putAsync } from './gun';
import { HEARTBEAT_SECONDS, ONLINE_WINDOW_SECONDS } from './config';

export type Profile = {
  name: string;
  phone: string;
  dob?: string; // cifrata nel grafo
  avatar?: string | null; // data URI
  lastSeen?: number;
  pushToken?: string | null;
};

export const profileNode = (pub: string) => gun.get('~' + pub).get('profile');

export async function getProfile(pub: string, timeoutMs = 4000): Promise<Profile | undefined> {
  return clean<Profile>(await onceAsync(profileNode(pub), timeoutMs));
}

/** Legge il proprio profilo decifrando la data di nascita. */
export async function getMyProfile(): Promise<Profile | undefined> {
  const pub = user.is?.pub;
  if (!pub) return undefined;
  const p = await getProfile(pub);
  if (p?.dob) {
    try {
      p.dob = (await SEA.decrypt(p.dob, user._.sea)) ?? '';
    } catch {
      p.dob = '';
    }
  }
  return p;
}

export async function updateMyProfile(patch: Partial<Profile>) {
  const data: any = { ...patch };
  if (typeof patch.dob === 'string') data.dob = await SEA.encrypt(patch.dob, user._.sea);
  await putAsync(user.get('profile'), data);
}

export const isOnline = (p?: Profile) =>
  !!p?.lastSeen && Date.now() - Number(p.lastSeen) < ONLINE_WINDOW_SECONDS * 1000;

/** "Battito cardiaco": aggiorna lastSeen ogni N secondi mentre l'app è aperta. */
export function startHeartbeat(): () => void {
  const beat = () => user.is && user.get('profile').get('lastSeen').put(Date.now());
  beat();
  const id = setInterval(beat, HEARTBEAT_SECONDS * 1000);
  return () => clearInterval(id);
}
