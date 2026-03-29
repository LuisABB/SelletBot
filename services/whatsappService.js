// Permite enviar mensajes personalizados (ej: botones interactivos)
const fetch = require('node-fetch');

const PAGE_ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const BASE_URL = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
const HEADERS = {
  'Authorization': `Bearer ${PAGE_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

async function sendWhatsAppRawMessage(body) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  return res.json();
}

async function sendWhatsAppImage(to, imageUrl, caption = '') {
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: { link: imageUrl, caption }
  };
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('[WhatsApp API][sendWhatsAppImage] to:', to, 'image:', imageUrl, 'caption:', caption, 'response:', JSON.stringify(data));
  return data;
}

async function sendWhatsAppMessage(to, text) {
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text }
  };
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log('[WhatsApp API][sendWhatsAppMessage] to:', to, 'text:', text, 'response:', JSON.stringify(data));
  return data;
}

module.exports = { sendWhatsAppMessage, sendWhatsAppImage, sendWhatsAppRawMessage };
