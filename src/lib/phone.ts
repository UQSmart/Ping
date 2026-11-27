import { APP_NS, DEFAULT_COUNTRY_CODE } from './config';

/**
 * Normalizza un numero di telefono in formato E.164 (+393331234567).
 * È fondamentale: il numero è l'identificativo dell'utente (il suo "alias" GUN)
 * e deve combaciare con quello salvato nella rubrica degli amici.
 */
export function normalizePhone(raw: string, countryCode = DEFAULT_COUNTRY_CODE): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[^\d+]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (!s.startsWith('+')) {
    // In Italia lo 0 iniziale (fissi) fa parte del numero; altrove (es. UK) va tolto.
    if (countryCode !== '39') s = s.replace(/^0/, '');
    s = '+' + countryCode + s;
  }
  const digits = s.slice(1);
  if (!/^\d{7,15}$/.test(digits)) return null;
  return s;
}

/** Alias GUN di un utente = namespace + numero normalizzato. */
export const aliasFor = (phone: string) => `${APP_NS}:${phone}`;

/** Numero per link wa.me (solo cifre). */
export const waNumber = (phone: string) => phone.replace(/\D/g, '');
