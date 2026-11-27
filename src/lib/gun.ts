/**
 * Istanza unica di GUN + SEA condivisa da tutta l'app.
 *
 * Il "database" di Ping! è il grafo GUN: un grande oggetto JSON distribuito,
 * replicato fra i telefoni e i relay. Non esistono tabelle né API REST:
 * si legge con .get().once()/.on() e si scrive con .put().
 */
import { APP_NS, GUN_PEERS } from './config';

// require() invece di import: GUN è CommonJS e i suoi tipi sono molto generici.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Gun = require('gun/gun');
// SEA aggiunge utenti, firme e cifratura (Gun.SEA, gun.user()).
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('gun/sea');

export type GunChain = any;

export const gun: GunChain = Gun({
  peers: GUN_PEERS,
  // In React Native non c'è localStorage: niente persistenza locale di GUN.
  // Ciò che serve offline (sessione, impostazioni, ping salvati) lo salviamo
  // noi con SecureStore / AsyncStorage (vedi storage.ts).
  localStorage: false,
  radisk: false,
});

export const SEA: any = Gun.SEA;

/** L'utente SEA (login/registrazione/firma). `user.is` è valorizzato se loggato. */
export const user: GunChain = gun.user();

/** Nodo radice dell'app nel grafo. */
export const app = (): GunChain => gun.get(APP_NS);

/**
 * Legge un nodo una sola volta, con timeout.
 * GUN non dice mai "non esiste": se nessun peer risponde, .once() può
 * non chiamare mai la callback. Per questo usiamo un timeout.
 */
export function onceAsync<T = any>(chain: GunChain, timeoutMs = 4000): Promise<T | undefined> {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(undefined);
      }
    }, timeoutMs);
    chain.once((data: T) => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve(data ?? undefined);
    });
  });
}

/** put() come Promise: risolve quando almeno un peer ha confermato (o in locale). */
export function putAsync(chain: GunChain, data: any, timeoutMs = 6000): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    const t = setTimeout(() => {
      // Nessun ack entro il timeout: il dato è comunque nel grafo locale e
      // verrà sincronizzato appena un relay sarà raggiungibile.
      if (!done) {
        done = true;
        resolve();
      }
    }, timeoutMs);
    chain.put(data, (ack: any) => {
      if (done) return;
      done = true;
      clearTimeout(t);
      if (ack && ack.err) reject(new Error(String(ack.err)));
      else resolve();
    });
  });
}

/** Rimuove i metadati interni di GUN ("_") da un nodo letto. */
export function clean<T extends Record<string, any>>(node: any): T | undefined {
  if (!node || typeof node !== 'object') return undefined;
  const { _, ...rest } = node;
  return rest as T;
}
