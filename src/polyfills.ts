/**
 * POLYFILL — deve essere il PRIMO import dell'app (vedi src/app/_layout.tsx).
 *
 * GUN usa il modulo SEA (Security, Encryption, Authorization) per firmare e
 * cifrare i dati. SEA si appoggia alla WebCrypto API del browser
 * (crypto.getRandomValues + crypto.subtle), che React Native NON ha.
 *
 *  - crypto.getRandomValues -> fornito da expo-crypto (nativo, incluso in Expo Go)
 *  - crypto.subtle          -> fornito da react-native-webview-crypto, che esegue
 *                              le operazioni crittografiche dentro una WebView
 *                              invisibile (componente <PolyfillCrypto /> in _layout)
 *  - TextEncoder/TextDecoder-> Hermes li ha già; in caso contrario usiamo text-encoding
 */
import { Platform } from 'react-native';
import * as ExpoCrypto from 'expo-crypto';

const g: any = globalThis as any;

if (typeof g.crypto !== 'object' || g.crypto === null) {
  g.crypto = {};
}
if (typeof g.crypto.getRandomValues !== 'function') {
  g.crypto.getRandomValues = (arr: any) => ExpoCrypto.getRandomValues(arr);
}

if (typeof g.TextEncoder === 'undefined' || typeof g.TextDecoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const te = require('text-encoding');
  g.TextEncoder = g.TextEncoder || te.TextEncoder;
  g.TextDecoder = g.TextDecoder || te.TextDecoder;
}

// Questo import imposta globalThis.crypto.subtle (proxy verso la WebView).
// Nel browser (expo start --web) la WebCrypto esiste già: non serve.
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-webview-crypto');
}
