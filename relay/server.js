/**
 * RELAY GUN (facoltativo ma consigliato).
 *
 * Non è un "server applicativo": non contiene logica di Ping!, non espone API,
 * non ha un database con tabelle. È il nodo GUN standard che:
 *   1. fa da ponte fra i telefoni (che non possono parlarsi direttamente);
 *   2. tiene una copia cache del grafo, così i ping arrivano anche se il
 *      destinatario si collega più tardi.
 * Tutti i contenuti dei ping passano CIFRATI: il relay non può leggerli.
 *
 * Avvio:  npm run relay   (porta 8765, oppure PORT=xxxx npm run relay)
 * Poi in src/lib/config.ts metti: 'http://IP_DEL_PC:8765/gun'
 */
const http = require('http');
const Gun = require('gun');

const port = Number(process.env.PORT || 8765);

const server = http.createServer((req, res) => {
  if (Gun.serve(req, res)) return; // serve anche /gun.js
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Ping! GUN relay is running\n');
});

Gun({ web: server, file: process.env.GUN_DATA_DIR || 'relay-data' });

server.listen(port, () => {
  console.log(`Ping! relay listening on http://0.0.0.0:${port}/gun`);
});
