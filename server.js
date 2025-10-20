// Minimal Node.js server for handling POST /api/contact
// No external dependencies required (uses native http module)
const http = require('http');

const PORT = process.env.PORT || 3000;

function sendJSON(res, status, obj) {
  const payload = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/contact') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protection: limit size
      if (body.length > 1e6) {
        // Flood attack or faulty client, destroy connection
        req.connection.destroy();
      }
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        // Basic validation
        if (!data.name || !data.email || !data.message) {
          sendJSON(res, 400, { message: 'Faltan campos requeridos' });
          return;
        }

        // Here you would normally enqueue an email, save to DB, etc.
        console.log('Contacto recibido:', data);

        sendJSON(res, 200, { message: '¡Mensaje recibido! Gracias por contactarnos.' });
      } catch (err) {
        console.error('Error parsing JSON:', err);
        sendJSON(res, 400, { message: 'JSON inválido' });
      }
    });

    return;
  }

  // For any other request, serve a small info response
  if (req.method === 'GET' && req.url === '/health') {
    sendJSON(res, 200, { status: 'ok' });
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
