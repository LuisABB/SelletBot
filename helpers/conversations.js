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
  // Fetch current state
  const current = await db.collection('conversations').findOne(query);
  // Logging para depuración
  console.log('[updateConversation] user_id:', user_id, '| current.state:', current?.state, '| new state:', state, '| context:', context);
  // If current state is 'esperando_pago', only allow update if moving to '5-pagado' or resetting
  if (current && current.state === 'esperando_pago') {
    if (state && state !== 'esperando_pago' && state !== '5-pagado' && state !== '1-inicio') {
      console.log('[updateConversation] IGNORADO: No se permite sobrescribir esperando_pago con', state);
      // But still update context if provided
      const update = { $set: { last_message_at: new Date() } };
      if (context) update.$set.context = context;
      await db.collection('conversations').updateOne(query, update);
      return;
    }
  }
  // Normal update
  const update = { $set: { last_message_at: new Date() } };
  if (state) update.$set.state = state;
  if (context) update.$set.context = context;
  console.log('[updateConversation] ACTUALIZADO: Estado guardado como', state);
  await db.collection('conversations').updateOne(query, update);
}

module.exports = {
  findConversationByUser,
  createConversation,
  updateConversation
};
