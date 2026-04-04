// helpers/scheduledTasks.js
const { connectDB } = require('../db');

const { ObjectId } = require('mongodb');
// Crear tarea programada
async function createScheduledTask({ user_id, type, execute_at, status = 'pending', metadata = {} }) {
  const db = await connectDB();
  const now = new Date();
  const task = {
    user_id: typeof user_id === 'string' && ObjectId.isValid(user_id) ? new ObjectId(user_id) : user_id,
    type,
    execute_at,
    status,
    metadata,
    created_at: now
  };
  const result = await db.collection('scheduled_tasks').insertOne(task);
  return { ...task, _id: result.insertedId };
}

// Buscar tareas pendientes a ejecutar
async function findPendingTasks() {
  const db = await connectDB();
  return db.collection('scheduled_tasks').find({ status: 'pending', execute_at: { $lte: new Date() } }).toArray();
}

// Marcar tarea como realizada
async function markTaskDone(task_id) {
  const db = await connectDB();
  await db.collection('scheduled_tasks').updateOne({ _id: task_id }, { $set: { status: 'done' } });
}

module.exports = {
  createScheduledTask,
  findPendingTasks,
  markTaskDone
};
