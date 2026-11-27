/**
 * PING: invio e ricezione, cifrati end-to-end, senza server.
 *
 * Struttura nel grafo GUN:
 *
 *   ping-app-v1
 *     └─ inbox
 *         └─ <pub del destinatario>
 *             └─ <pingId> = { from: <pub mittente>, box: "<payload cifrato>", ts }
 *
 * - Il mittente calcola un SEGRETO CONDIVISO con il destinatario (ECDH:
 *   sua chiave privata + chiave pubblica del destinatario) e cifra
 *   { nome, testo, link } con quel segreto. Il relay vede solo testo cifrato.
 * - Il destinatario calcola lo stesso segreto (sua privata + pubblica del
 *   mittente) e decifra. Se la decifratura fallisce il ping è falso e viene scartato:
 *   questo garantisce anche che il mittente sia chi dice di essere.
 * - I ping sono TRANSITORI: una volta visti vengono cancellati (put(null)).
 *   Quelli non visti scadono dopo PING_TTL_HOURS.
 */
import { app, gun, user, SEA, onceAsync, putAsync } from './gun';
import { PING_TTL_HOURS } from './config';
import { getProfile } from './profile';
import { sendExpoPush } from './notifications';

export type PingContent = {
  text: string;
  links: Record<string, string>; // es. { instagram: 'https://instagram.com/p/...' }
};

export type ReceivedPing = PingContent & {
  id: string;
  fromPub: string;
  fromName: string;
  ts: number;
};

const inbox = (pub: string) => app().get('inbox').get(pub);

const epubCache: Record<string, string> = {};
async function epubOf(pub: string): Promise<string | undefined> {
  if (epubCache[pub]) return epubCache[pub];
  const node = await onceAsync<any>(gun.get('~' + pub));
  if (node?.epub) epubCache[pub] = node.epub;
  return node?.epub;
}

function newId() {
  const b = new Uint8Array(6);
  (globalThis as any).crypto.getRandomValues(b);
  return Date.now().toString(36) + '-' + Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** Invia un ping a un destinatario (identificato dalla sua chiave pubblica). */
export async function sendPing(toPub: string, content: PingContent, myName: string) {
  const me = user._.sea;
  if (!me) throw new Error('Not logged in');
  const epub = await epubOf(toPub);
  if (!epub) throw new Error('Recipient not reachable right now, please try again');

  const secret = await SEA.secret(epub, me);
  const ts = Date.now();
  const box = await SEA.encrypt({ name: myName, text: content.text, links: content.links, ts }, secret);
  await putAsync(inbox(toPub).get(newId()), { from: me.pub, box, ts });

  // Notifica push (facoltativa) se il destinatario ha registrato un token.
  const p = await getProfile(toPub, 2500);
  if (p?.pushToken) {
    sendExpoPush(p.pushToken, 'Ping!', `${myName} pinged you!`).catch(() => {});
  }
}

/** Cancella definitivamente un ping dalla propria inbox. */
export function deletePing(id: string) {
  const pub = user.is?.pub;
  if (pub) inbox(pub).get(id).put(null);
}

/**
 * Si mette in ascolto della propria inbox in tempo reale.
 * GUN chiama la callback per ogni ping esistente e per ogni nuovo arrivo.
 */
export function subscribeInbox(
  onPing: (p: ReceivedPing) => void,
  onRemove: (id: string) => void,
): () => void {
  const me = user._.sea;
  if (!me) return () => {};
  const ttl = PING_TTL_HOURS * 3600 * 1000;
  const chain = inbox(me.pub).map();
  const seen = new Set<string>();

  chain.on(async (data: any, id: string) => {
    if (!data || !data.box || !data.from) {
      seen.delete(id);
      onRemove(id);
      return;
    }
    if (seen.has(id)) return;
    seen.add(id);
    if (Date.now() - Number(data.ts || 0) > ttl) {
      deletePing(id); // scaduto
      return;
    }
    try {
      const epub = await epubOf(data.from);
      if (!epub) throw new Error('unknown sender');
      const secret = await SEA.secret(epub, me);
      const payload = await SEA.decrypt(data.box, secret);
      if (!payload || typeof payload !== 'object') throw new Error('bad payload');
      onPing({
        id,
        fromPub: data.from,
        fromName: String(payload.name || 'Someone'),
        text: String(payload.text || ''),
        links: payload.links || {},
        ts: Number(payload.ts || data.ts),
      });
    } catch {
      // Non decifrabile => non viene davvero da quel mittente: lo scartiamo.
      deletePing(id);
    }
  });

  return () => chain.off();
}
