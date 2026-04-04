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
  const result = await db.collection('users').insertOne(user);
  return { ...user, _id: result.insertedId };
}

// Actualiza la última interacción y status
async function updateUserInteraction(phone, status = null) {
  const db = await connectDB();
  // Solo actualiza status si se pasa explícitamente
  if (status) {
    await db.collection('users').updateOne(
      { phone },
      { $set: { last_interaction: new Date(), status } }
    );
  } else {
    // Solo actualiza la última interacción
    await db.collection('users').updateOne(
      { phone },
      { $set: { last_interaction: new Date() } }
    );
  }
}

// Actualiza métricas del usuario
async function updateUserMetrics(phone, { total_orders, total_spent, last_order_date }) {
  const db = await connectDB();
    // Si es la primera orden, pasa a cliente
    if (total_orders === 1) {
      await db.collection('users').updateOne(
        { phone },
        { $set: { 'metrics.total_orders': total_orders, 'metrics.total_spent': total_spent, 'metrics.last_order_date': last_order_date, status: 'cliente' } }
      );
    } else if (total_orders > 1) {
      await db.collection('users').updateOne(
        { phone },
        { $set: { 'metrics.total_orders': total_orders, 'metrics.total_spent': total_spent, 'metrics.last_order_date': last_order_date, status: 'recurrente' } }
      );
    } else {
      await db.collection('users').updateOne(
        { phone },
        { $set: { 'metrics.total_orders': total_orders, 'metrics.total_spent': total_spent, 'metrics.last_order_date': last_order_date } }
      );
    }
}

module.exports = {
  findUserByPhone,
  createUser,
  updateUserInteraction,
  updateUserMetrics
};
