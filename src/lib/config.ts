/**
 * Configurazione centrale di Ping!
 * Modifica qui i parametri senza toccare il resto del codice.
 */

/**
 * PEER GUN (relay).
 * GUN è peer-to-peer, ma due telefoni non possono collegarsi direttamente
 * fra loro via Internet: serve almeno un "relay", cioè un nodo GUN sempre
 * acceso che inoltra (e tiene in cache) i dati fra i dispositivi.
 * NON è un server applicativo: non ha API, non ha database né codice tuo,
 * è il programma GUN standard (vedi cartella /relay).
 *
 * - In sviluppo: avvia `npm run relay` sul tuo PC e metti qui
 *   'http://IP_DEL_TUO_PC:8765/gun' (stessa rete Wi-Fi del telefono).
 * - Oppure crea un file .env con: EXPO_PUBLIC_GUN_PEERS=http://192.168.1.10:8765/gun
 * - Puoi aggiungere più relay (separati da virgola): i dati vengono replicati su tutti.
 */
const PEERS_FROM_ENV = process.env.EXPO_PUBLIC_GUN_PEERS; // es. nel file .env

export const GUN_PEERS: string[] = PEERS_FROM_ENV
  ? PEERS_FROM_ENV.split(',').map((s: string) => s.trim()).filter(Boolean)
  : [
      'http://192.168.1.10:8765/gun', // <-- cambia con l'IP del tuo PC
      // 'https://il-tuo-relay.onrender.com/gun',
    ];

/** Namespace dell'app nel grafo GUN (evita collisioni con altre app sugli stessi relay). */
export const APP_NS = 'ping-app-v1';

/** Prefisso internazionale di default per normalizzare i numeri senza "+". */
export const DEFAULT_COUNTRY_CODE = '39';

/** Lunghezza massima del messaggio di un ping (la presentazione dice 30-50). */
export const MAX_MESSAGE_LENGTH = 50;

/** Per quante ore un ping non letto resta nella lista "Who pinged me?". */
export const PING_TTL_HOURS = 24;

/**
 * Quanti destinatari si possono selezionare per un singolo ping.
 * Versione base = 1 (come da presentazione); la versione premium potrebbe alzarlo.
 */
export const MAX_RECIPIENTS = 1;

/** Un utente è "Online" se ha dato segni di vita negli ultimi N secondi. */
export const ONLINE_WINDOW_SECONDS = 90;
export const HEARTBEAT_SECONDS = 30;

/**
 * Notifiche push quando l'app è chiusa: richiedono un servizio push
 * (Apple/Google). L'unico modo senza un TUO server è il servizio gratuito
 * di Expo (exp.host), chiamato direttamente dal telefono di chi invia.
 * Funziona solo in una development/production build con un projectId EAS.
 * Metti false per non usare nessun servizio esterno.
 */
export const ENABLE_EXPO_PUSH = true;

/** Messaggio di invito via WhatsApp per chi non ha l'app. */
export const INVITE_URL = 'https://example.com/download-ping';

export const COLORS = {
  primary: '#C84FD6', // viola Ping!
  primaryDark: '#A93AB8',
  primaryLight: '#D97BE3',
  field: '#B23FC2',
  fieldBorder: '#E7A6EE',
  white: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.65)',
  online: '#5CF08A',
  offline: '#F5C6FA',
  danger: '#FF5A7A',
  overlay: 'rgba(0,0,0,0.35)',
};
