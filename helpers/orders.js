// helpers/orders.js
const { connectDB } = require('../db');

// Crear un nuevo pedido
async function createOrder({ user_id, products, total, payment_link = '', payment_expiration = null, status = 'pending' }) {
  const db = await connectDB();
  const now = new Date();
  const order = {
    user_id,
    products,
    total,
    status,
    payment_link,
    payment_expiration,
    created_at: now
  };
  const result = await db.collection('orders').insertOne(order);
  return { ...order, _id: result.insertedId };
}

// Buscar pedidos por usuario
async function findOrdersByUser(user_id) {
  const db = await connectDB();
  return db.collection('orders').find({ user_id }).toArray();
}

// Actualizar status de pedido
async function updateOrderStatus(order_id, status) {
  const db = await connectDB();
  await db.collection('orders').updateOne({ _id: order_id }, { $set: { status } });
}

module.exports = {
  createOrder,
  findOrdersByUser,
  updateOrderStatus
};
