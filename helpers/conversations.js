// helpers/conversations.js
const { connectDB } = require('../db');

// Buscar conversación por usuario (por user_id de users)
const { ObjectId } = require('mongodb');
async function findConversationByUser(user_id) {
  const db = await connectDB();
  // Permite buscar por ObjectId o string
  let query = {};
  if (ObjectId.isValid(user_id)) {
    query.user_id = new ObjectId(user_id);
  } else {
    query.user_id = user_id;
  }
  return db.collection('conversations').findOne(query);
}

// Crear conversación
// user_id debe ser el ObjectId del usuario, phone el número
async function createConversation({ user_id, phone, state = 'inicio', context = {} }) {
  const db = await connectDB();
  const now = new Date();
    const update = {
      $set: {
        phone,
        state,
        context,
        last_message_at: now
      },
      $setOnInsert: {
        user_id: typeof user_id === 'string' && ObjectId.isValid(user_id) ? new ObjectId(user_id) : user_id,
        created_at: now
      }
    };
    const options = { upsert: true, returnDocument: 'after' };
    const result = await db.collection('conversations').findOneAndUpdate(
      { user_id: typeof user_id === 'string' && ObjectId.isValid(user_id) ? new ObjectId(user_id) : user_id },
      update,
      options
    );
    return result.value;
}

// Actualizar estado/contexto
async function updateConversation(user_id, { state, context }) {
  const db = await connectDB();
  let query = {};
  if (ObjectId.isValid(user_id)) {
    query.user_id = new ObjectId(user_id);
  } else {
    query.user_id = user_id;
  }
  // Logging para depuración
  const update = { $set: { last_message_at: new Date() } };
  if (state) update.$set.state = state;
  if (context) update.$set.context = context;
  await db.collection('conversations').updateOne(query, update);
}

module.exports = {
  findConversationByUser,
  createConversation,
  updateConversation
};
