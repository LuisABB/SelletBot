// db.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000 // 5 segundos de timeout para selección de servidor
});

let db = null;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('whatsapp_bot');
  }
  return db;
}

module.exports = { connectDB };