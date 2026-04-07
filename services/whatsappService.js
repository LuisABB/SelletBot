// Permite enviar mensajes personalizados (ej: botones interactivos)
const fetch = require('node-fetch');

const PAGE_ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const BASE_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
const HEADERS = {
  'Authorization': `Bearer ${PAGE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// Maximum time (ms) to wait for a single WhatsApp API call before aborting.
const FETCH_TIMEOUT_MS = 15000;

/**
 * Wraps node-fetch with an AbortController-based timeout so that a slow or
 * unresponsive WhatsApp API never stalls the webhook processing chain.
 */
async function fetchWithTimeout(url, options, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`[WhatsApp API] Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function sendWhatsAppRawMessage(body) {
  console.log('[WhatsApp API][sendWhatsAppRawMessage] Sending to:', body && body.to, '| type:', body && body.type);
  const res = await fetchWithTimeout(BASE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('[WhatsApp API][sendWhatsAppRawMessage] response:', JSON.stringify(data));
  return data;
}

async function sendWhatsAppImage(to, imageUrl, caption = '') {
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: { link: imageUrl, caption }
  };
  console.log('[WhatsApp API][sendWhatsAppImage] to:', to, '| image:', imageUrl);
  const res = await fetchWithTimeout(BASE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('[WhatsApp API][sendWhatsAppImage] to:', to, 'caption:', caption, 'response:', JSON.stringify(data));
  return data;
}

async function sendWhatsAppMessage(to, text) {
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text }
  };
  console.log('[WhatsApp API][sendWhatsAppMessage] to:', to, '| text:', text && text.substring(0, 80));
  const res = await fetchWithTimeout(BASE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('[WhatsApp API][sendWhatsAppMessage] to:', to, 'response:', JSON.stringify(data));
  return data;
}

module.exports = { sendWhatsAppMessage, sendWhatsAppImage, sendWhatsAppRawMessage };
