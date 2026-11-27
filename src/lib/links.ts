/**
 * Social network supportati (slide 6.1): un ping può contenere da 0 a 6 link,
 * uno per piattaforma. Nessun altro link è ammesso.
 */
export type SocialId = 'facebook' | 'instagram' | 'x' | 'youtube' | 'tiktok' | 'pinterest';

export const SOCIALS: {
  id: SocialId;
  label: string;
  icon: string; // nome icona FontAwesome6 (@expo/vector-icons)
  color: string;
  hosts: string[];
}[] = [
  { id: 'facebook', label: 'Facebook', icon: 'facebook-f', color: '#1877F2', hosts: ['facebook.com', 'fb.com', 'fb.watch'] },
  { id: 'instagram', label: 'Instagram', icon: 'instagram', color: '#E1306C', hosts: ['instagram.com', 'instagr.am'] },
  { id: 'x', label: 'X', icon: 'x-twitter', color: '#000000', hosts: ['x.com', 'twitter.com'] },
  { id: 'youtube', label: 'YouTube', icon: 'youtube', color: '#FF0000', hosts: ['youtube.com', 'youtu.be'] },
  { id: 'tiktok', label: 'TikTok', icon: 'tiktok', color: '#111111', hosts: ['tiktok.com'] },
  { id: 'pinterest', label: 'Pinterest', icon: 'pinterest-p', color: '#E60023', hosts: ['pinterest.com', 'pin.it'] },
];

/** Verifica che l'URL appartenga davvero alla piattaforma scelta. */
export function isValidSocialLink(id: SocialId, url: string): boolean {
  const s = SOCIALS.find((x) => x.id === id);
  if (!s) return false;
  // Regex invece di new URL(): l'implementazione di URL in React Native è parziale.
  const m = /^https?:\/\/([^/?#:\s]+)(?::\d+)?(?:[/?#]\S*)?$/i.exec(url.trim());
  if (!m) return false;
  const host = m[1].toLowerCase().replace(/^(www|m|vm|mobile)\./, '');
  return s.hosts.some((h) => host === h || host.endsWith('.' + h));
}

/** Il testo del ping non può contenere link (slide 6.1). */
export function containsUrl(text: string): boolean {
  return /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|it|net|org|io|ly|me|co|app|be)\b/i.test(text);
}
