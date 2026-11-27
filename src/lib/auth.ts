/**
 * Autenticazione SENZA server, con GUN SEA.
 *
 * Come funziona:
 *  - Alla registrazione SEA genera una coppia di chiavi crittografiche
 *    (pub/priv per firmare, epub/epriv per cifrare). La chiave privata viene
 *    cifrata con la password e pubblicata nel grafo sotto l'alias
 *    "ping-app-v1:+39333...". Nessuno (nemmeno il relay) vede la password.
 *  - Il login scarica il blocco cifrato e prova a decifrarlo con la password:
 *    se ci riesce, l'utente possiede le chiavi => è autenticato.
 *  - L'identità dell'utente nel grafo è la sua chiave pubblica: "~<pub>".
 *    Solo il proprietario può scrivere sotto "~<pub>" (le scritture sono firmate).
 *
 * Recupero password: senza server non si possono mandare SMS con codici.
 * Alla registrazione generiamo un CODICE DI RECUPERO (da annotare) e
 * pubblichiamo una copia delle chiavi private cifrata con quel codice.
 * Chi conosce numero + codice recupera le chiavi e imposta una nuova password.
 */
import { SEA, user, gun, onceAsync, putAsync } from './gun';
import { aliasFor } from './phone';
import { saveSession, clearSession, loadSession } from './storage';

export class AuthError extends Error {}

function createAsync(alias: string, pass: string): Promise<void> {
  return new Promise((resolve, reject) => {
    user.create(alias, pass, (ack: any) => (ack.err ? reject(new AuthError(ack.err)) : resolve()));
  });
}

function authAsync(aliasOrPair: any, pass?: string, opt?: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const cb = (ack: any) => (ack.err ? reject(new AuthError(ack.err)) : resolve());
    if (typeof aliasOrPair === 'object') user.auth(aliasOrPair, cb);
    else if (opt) user.auth(aliasOrPair, pass, cb, opt);
    else user.auth(aliasOrPair, pass, cb);
  });
}

/** Chiave pubblica di un utente partendo dal suo numero (null se non ha Ping!). */
export async function pubForPhone(phone: string, timeoutMs = 3500): Promise<string | null> {
  const node = await onceAsync<any>(gun.get('~@' + aliasFor(phone)), timeoutMs);
  if (!node) return null;
  const key = Object.keys(node).find((k) => k.startsWith('~'));
  return key ? key.slice(1) : null;
}

/** Genera un codice di recupero leggibile, es. "K7QM-2XPA-9DTR". */
function makeRecoveryCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  (globalThis as any).crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

async function persistSession(phone: string) {
  const pair = user._.sea; // coppia di chiavi in memoria dopo il login
  await saveSession({ pair, phone });
}

export type SignUpData = {
  name: string;
  dob: string; // gg/mm/aaaa
  phone: string; // già normalizzato
  password: string;
  avatar?: string | null; // data URI jpeg
};

/** Registrazione. Ritorna il codice di recupero da mostrare UNA volta all'utente. */
export async function signUp(d: SignUpData): Promise<string> {
  if (await pubForPhone(d.phone)) {
    throw new AuthError('The mobile number is already used by an existing user');
  }
  const alias = aliasFor(d.phone);
  await createAsync(alias, d.password);
  await authAsync(alias, d.password);

  const pair = user._.sea;
  const recoveryCode = makeRecoveryCode();
  // La data di nascita è un dato personale: la cifriamo con la NOSTRA chiave.
  const dobEnc = await SEA.encrypt(d.dob, pair);
  // Copia delle chiavi private cifrata col codice di recupero (vedi recoverWithCode).
  const recovery = await SEA.encrypt({ priv: pair.priv, epriv: pair.epriv }, recoveryCode);

  await putAsync(user.get('profile'), {
    name: d.name.trim(),
    phone: d.phone,
    dob: dobEnc,
    avatar: d.avatar ?? null,
    lastSeen: Date.now(),
  });
  await putAsync(user.get('recovery'), recovery);
  await persistSession(d.phone);
  return recoveryCode;
}

export async function logIn(phone: string, password: string) {
  try {
    await authAsync(aliasFor(phone), password);
  } catch {
    throw new AuthError('Either the mobile number or the password entered are not recognised, please try again');
  }
  await persistSession(phone);
}

/** All'avvio: se c'è una sessione salvata, rientra con la coppia di chiavi. */
export async function restoreSession(): Promise<string | null> {
  const s = await loadSession();
  if (!s?.pair) return null;
  try {
    await authAsync(s.pair);
    return s.phone;
  } catch {
    return null;
  }
}

export async function logOut() {
  user.leave();
  await clearSession();
}

/** Cambio password da loggato (Settings > Password and security). */
export async function changePassword(phone: string, oldPass: string, newPass: string) {
  try {
    // SEA verifica la vecchia password e ricifra la chiave privata con la nuova.
    await authAsync(aliasFor(phone), oldPass, { change: newPass });
  } catch {
    throw new AuthError('The current password is not correct');
  }
  await persistSession(phone);
}

/**
 * Recupero password - passo 1: verifica numero + codice di recupero.
 * Se il codice è giusto decifra le chiavi private e fa login con esse.
 */
export async function recoverWithCode(phone: string, code: string): Promise<void> {
  const pub = await pubForPhone(phone);
  if (!pub) throw new AuthError('This mobile number is not registered on Ping!');
  const root = await onceAsync<any>(gun.get('~' + pub));
  const blob = await onceAsync<string>(gun.get('~' + pub).get('recovery'));
  const keys = blob ? await SEA.decrypt(blob, code.trim().toUpperCase()) : undefined;
  if (!keys || !keys.priv || !root?.epub) {
    throw new AuthError('The password reset code is not recognised, please try again');
  }
  await authAsync({ pub, epub: root.epub, priv: keys.priv, epriv: keys.epriv });
}

/**
 * Recupero password - passo 2: con l'utente già autenticato tramite chiavi,
 * scrive un nuovo record "auth" cifrato con la nuova password
 * (stesso formato che usa SEA internamente in user.create/auth).
 */
export async function setNewPassword(phone: string, newPass: string) {
  const pair = user._.sea;
  if (!pair) throw new AuthError('Session expired, please start again');
  const saltBytes = new Uint8Array(32);
  (globalThis as any).crypto.getRandomValues(saltBytes);
  const salt = Array.from(saltBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const proof = await SEA.work(newPass, salt);
  const ek = await SEA.encrypt({ priv: pair.priv, epriv: pair.epriv }, proof, null, { raw: 1 });
  await putAsync(gun.get('~' + pair.pub).get('auth'), JSON.stringify({ ek, s: salt }));
  await persistSession(phone);
}
