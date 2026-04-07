require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhook');

const fs = require('fs');
const path = require('path');

// ── Process-level crash handlers ──────────────────────────────────────────────
// Catch synchronous throws that escape all try/catch blocks.
process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException — process will continue:', err);
});

// Catch unhandled promise rejections (e.g. a forgotten await, a fire-and-forget
// async call that throws, etc.).
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] unhandledRejection at:', promise, '| reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/', webhookRoutes);

// Endpoint para descargar logs.json
app.get('/logs', (req, res) => {
  const filePath = path.join(__dirname, 'logs.json');
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('No logs found');
  }
  res.download(filePath);
});

app.get('/', (req, res) => {
  res.send('SellerBot MVP running');
});

// ── Global Express error handler ──────────────────────────────────────────────
// Must be registered AFTER all routes. Catches any error passed via next(err)
// or thrown synchronously inside a route handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR HANDLER]', {
    method: req.method,
    url: req.url,
    message: err && err.message,
    stack: err && err.stack,
  });
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', detail: err && err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
