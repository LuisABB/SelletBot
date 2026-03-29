require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhook');

const fs = require('fs');
const path = require('path');

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
