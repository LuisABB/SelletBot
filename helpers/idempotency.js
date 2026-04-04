// helpers/idempotency.js
const { connectDB } = require('../db');

async function isDuplicateMessage(messageId) {
  const db = await connectDB();
  const exists = await db.collection('messages_processed').findOne({ _id: messageId });
  return !!exists;
}

async function markMessageProcessed(messageId) {
  const db = await connectDB();
  await db.collection('messages_processed').insertOne({
    _id: messageId,
    processed_at: new Date()
  });
}

module.exports = { isDuplicateMessage, markMessageProcessed };