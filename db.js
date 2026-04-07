// db.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('[DB] MONGODB_URI is not set — database calls will fail.');
}

const client = new MongoClient(uri, {
  // How long the driver waits to find an available server before throwing.
  serverSelectionTimeoutMS: 8000,
  // How long a single TCP connection attempt may take.
  connectTimeoutMS: 8000,
  // How long an idle socket may sit before being closed.
  socketTimeoutMS: 30000,
});

let db = null;

async function connectDB() {
  if (!db) {
    console.log('[DB] Connecting to MongoDB…');
    await client.connect();
    db = client.db('whatsapp_bot');
    console.log('[DB] Connected to MongoDB successfully.');
  }
  return db;
}

module.exports = { connectDB };