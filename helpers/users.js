// helpers/users.js
const { connectDB } = require('../db');

// Encuentra un usuario por teléfono
async function findUserByPhone(phone) {
  const db = await connectDB();
  const user = await db.collection('users').findOne({ phone });
  console.log('[findUserByPhone] Buscando usuario con phone:', phone, '| Encontrado:', !!user);
  return user;
}

// Crea un nuevo usuario
async function createUser({ phone, name = '', source = 'whatsapp', tags = [], status = 'lead' }) {
  const db = await connectDB();
  const now = new Date();
  const user = {
    phone,
    name,
    source,
    tags,
    status,
    last_interaction: now,
    created_at: now,
    metrics: {
      total_orders: 0,
      total_spent: 0,
      last_order_date: null
    }
  };
  console.log('[createUser] Creando usuario:', user);
  const result = await db.collection('users').insertOne(user);
  console.log('[createUser] Resultado insertOne:', result);
  return { ...user, _id: result.insertedId };
}

// Actualiza la última interacción y status
async function updateUserInteraction(phone, status = null) {
  const db = await connectDB();
  const update = { $set: { last_interaction: new Date() } };
  if (status) update.$set.status = status;
  await db.collection('users').updateOne({ phone }, update);
}

// Actualiza métricas del usuario
async function updateUserMetrics(phone, { total_orders, total_spent, last_order_date }) {
  const db = await connectDB();
  await db.collection('users').updateOne(
    { phone },
    { $set: { 'metrics.total_orders': total_orders, 'metrics.total_spent': total_spent, 'metrics.last_order_date': last_order_date } }
  );
}

module.exports = {
  findUserByPhone,
  createUser,
  updateUserInteraction,
  updateUserMetrics
};
