const fs = require('fs');
const path = require('path');


const LOG_FILE = path.join(__dirname, '../logs.json');


/**
 * Registra un mensaje en logs.json
 * @param {Object} params
 * @param {string} params.user_id
 * @param {string} params.role
 * @param {string|Object} params.message
 * @param {string} params.step
 * @param {string} [params.type] - Tipo de mensaje: text, image, button, payment_link, etc.
 * @param {Object} [params.extra] - Datos extra relevantes (caption, image_url, payload, etc.)
 */

function logMessage({ user_id, role, message, step, type = 'text', extra = {} }) {
  const entry = {
    user_id,
    role,
    message,
    step,
    type,
    extra,
    timestamp: new Date().toISOString(),
  };
  let logs = [];
  try {
    if (fs.existsSync(LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
  } catch (e) {
    logs = [];
  }
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

module.exports = { logMessage };
