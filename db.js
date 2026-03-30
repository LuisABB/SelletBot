// db.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://bot_user:Bot_2026_secure%21@botselldeveloper.vxy3wag.mongodb.net/whatsapp_bot?retryWrites=true&w=majority';
const client = new MongoClient(uri);

let db = null;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('whatsapp_bot');
  }
  return db;
}

module.exports = { connectDB };