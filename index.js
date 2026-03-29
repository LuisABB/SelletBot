require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/', webhookRoutes);

app.get('/', (req, res) => {
  res.send('SellerBot MVP running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
