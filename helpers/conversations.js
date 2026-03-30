// helpers/conversations.js
const { connectDB } = require('../db');

// Buscar conversación por usuario
async function findConversationByUser(user_id) {
  const db = await connectDB();
  return db.collection('conversations').findOne({ user_id });
}

// Crear conversación
async function createConversation({ user_id, state = 'inicio', context = {} }) {
  const db = await connectDB();
  const now = new Date();
  const conversation = {
    user_id,
    state,
    context,
    last_message_at: now
  };
  const result = await db.collection('conversations').insertOne(conversation);
  return { ...conversation, _id: result.insertedId };
}

// Actualizar estado/contexto
async function updateConversation(user_id, { state, context }) {
  const db = await connectDB();
  const update = { $set: { last_message_at: new Date() } };
  if (state) update.$set.state = state;
  if (context) update.$set.context = context;
  await db.collection('conversations').updateOne({ user_id }, update);
}

module.exports = {
  findConversationByUser,
  createConversation,
  updateConversation
};
