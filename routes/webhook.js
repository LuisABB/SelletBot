const express = require('express');
const router = express.Router();
const { handleUserMessage } = require('../services/botService');
const whatsappService = require('../services/whatsappService');
const { logMessage } = require('../services/logger');

// ================= HELPERS =================
function normalizeNumber(number) {
  return number.replace(/\D/g, '');
}

function fixMexicanNumber(number) {
  if (number.startsWith('521')) {
    return '52' + number.slice(3);
  }
  return number;
}

// ================= WEBHOOK SIMPLE =================
router.post('/webhook', (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: 'Faltan user_id o message' });
  }

  const response = handleUserMessage(user_id, message);
  res.json({ reply: response });
});

// ================= WHATSAPP WEBHOOK =================
router.post('/whatsapp-webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];

    if (!msg) return res.sendStatus(200);

    const user_id = msg.from;
    const message = msg.text?.body || '';

    const reply = handleUserMessage(user_id, message);

    await whatsappService.sendWhatsAppMessage(user_id, reply);

    res.json({ reply });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ================= UNIVERSAL WEBHOOK =================
router.post('/universal-webhook', async (req, res) => {
  try {
    console.log('--- Nueva petición ---');

    let user_id, message;


    // Detectar formato WhatsApp
    if (req.body.entry && req.body.entry[0]?.changes) {
      const entry = req.body.entry[0].changes[0].value;

      if (!entry.messages || !entry.messages[0]) {
        return res.sendStatus(200);
      }

      const msg = entry.messages[0];
      let raw_user_id = msg.from;
      let normalized_user_id = fixMexicanNumber(normalizeNumber(raw_user_id));
      user_id = normalized_user_id;

      if (
        msg.interactive &&
        msg.interactive.type === 'button_reply'
      ) {
        message = msg.interactive.button_reply.id;
        // Loggear click de botón del usuario
        logMessage({
          user_id: normalized_user_id,
          role: 'user',
          message,
          step: 'button_click',
          type: 'button',
          extra: {
            button_reply: msg.interactive.button_reply
          }
        });
      } else {
        message = msg.text?.body || '';
        // Loggear mensaje de texto del usuario
        logMessage({
          user_id: normalized_user_id,
          role: 'user',
          message,
          step: 'text',
          type: 'text',
          extra: {}
        });
      }

    } else {
      let raw_user_id = req.body.user_id;
      let normalized_user_id = fixMexicanNumber(normalizeNumber(raw_user_id));
      user_id = normalized_user_id;
      message = req.body.message;
      // Loggear mensaje recibido por API local
      logMessage({
        user_id: normalized_user_id,
        role: 'user',
        message,
        step: 'text',
        type: 'text',
        extra: {}
      });
    }

    if (!user_id || !message) {
      return res.status(400).json({ error: 'Faltan user_id o message' });
    }

    let reply = null;
    let cleanNumber = null;

    // ================= WHATSAPP =================
    if (req.body.entry) {

      cleanNumber = normalizeNumber(user_id);
      cleanNumber = fixMexicanNumber(cleanNumber);

      console.log('📤 Enviando a:', cleanNumber);

      const { getUserState } = require('../services/cartService');
      let products = require('../services/products');

      // Ordenar productos
      products = products.slice().sort((a, b) => a.name.localeCompare(b.name));

      // Quitar duplicados
      const seen = new Set();
      products = products.filter(p => {
        if (seen.has(p.name)) return false;
        seen.add(p.name);
        return true;
      });

      const user = getUserState(cleanNumber);

      const RESET_WORDS = ['hi', 'hola', 'inicio', 'start', 'reiniciar'];
      const normalizedMsg = message.trim().toLowerCase();

      // ================= FLUJO INICIAL, VER MÁS, O AGREGAR AL CARRITO =================
      const isFlujoInicial =
        (user.step === 'choosing' || user.step === 'start') &&
        user.cart_count === 0 &&
        !user.flujo_inicial_enviado &&
        RESET_WORDS.includes(normalizedMsg);

      const isVerMas = message === 'VER_MAS_PRODUCTOS';

      // Si el mensaje es un id de producto válido, agregar al carrito
      const prodId = parseInt(message.trim());
      const isProductId = !isNaN(prodId) && products.some(p => p.id === prodId);

      if (isFlujoInicial) {
        if (!user.product_page) user.product_page = 0;
        const pageSize = 4;
        const startIdx = user.product_page * pageSize;
        const endIdx = startIdx + pageSize;
        const productsToSend = products.slice(startIdx, endIdx);
        // Promo solo en el inicio
        let promoSent = false;
        if (user.product_page === 0) {
          user.flujo_inicial_enviado = true;
          const promoText = '🔥 PROMO 4x3 por tiempo limitado\n\nTe llevas 4 relojes y uno va GRATIS\n\n👇 Elige el primero';
          await whatsappService.sendWhatsAppMessage(cleanNumber, promoText);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: promoText,
            step: user.step,
            type: 'text'
          });
          promoSent = true;
        }
        for (const p of productsToSend) {
          await new Promise(r => setTimeout(r, 1500));
          let caption = `${p.name}`;
          if (p.variant) caption += `\nVariante: ${p.variant}`;
          caption += `\nPrecio: $${p.price}`;
          await whatsappService.sendWhatsAppImage(cleanNumber, p.image_url, caption);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: caption,
            step: user.step,
            type: 'image',
            extra: { image_url: p.image_url }
          });
          await new Promise(r => setTimeout(r, 1500));
          const buttonPayload = {
            messaging_product: 'whatsapp',
            to: cleanNumber,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: 'Quiero este 👆' },
              action: {
                buttons: [
                  {
                    type: 'reply',
                    reply: {
                      id: String(p.id),
                      title: 'Agregar al carrito'
                    }
                  }
                ]
              }
            }
          };
          await whatsappService.sendWhatsAppRawMessage(buttonPayload);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: 'Botón: Agregar al carrito',
            step: user.step,
            type: 'button',
            extra: { payload: buttonPayload }
          });
        }
        if (endIdx < products.length) {
          const verMasPayload = {
            messaging_product: 'whatsapp',
            to: cleanNumber,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: '¿Quieres ver más productos?' },
              action: {
                buttons: [
                  {
                    type: 'reply',
                    reply: {
                      id: 'VER_MAS_PRODUCTOS',
                      title: 'Ver más'
                    }
                  }
                ]
              }
            }
          };
          await whatsappService.sendWhatsAppRawMessage(verMasPayload);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: 'Botón: Ver más productos',
            step: user.step,
            type: 'button',
            extra: { payload: verMasPayload }
          });
          user.product_page += 1;
          // Confirmar que la promo fue enviada por WhatsApp
          if (promoSent) {
            return res.json({ reply: 'Promo y productos enviados por WhatsApp.' });
          } else {
            return res.json({ reply: 'Mostrando más productos...' });
          }
        } else {
          user.product_page = 0;
          if (promoSent) {
            return res.json({ reply: 'Promo y todos los productos enviados por WhatsApp.' });
          } else {
            return res.json({ reply: 'Todos los productos enviados' });
          }
        }
      } else if (isVerMas) {
        // Permitir ver más productos aunque no sea RESET_WORDS
        if (!user.product_page) user.product_page = 0;
        const pageSize = 4;
        const startIdx = user.product_page * pageSize;
        const endIdx = startIdx + pageSize;
        const productsToSend = products.slice(startIdx, endIdx);
        for (const p of productsToSend) {
          await new Promise(r => setTimeout(r, 1500));
          let caption = `${p.name}`;
          if (p.variant) caption += `\nVariante: ${p.variant}`;
          caption += `\nPrecio: $${p.price}`;
          await whatsappService.sendWhatsAppImage(cleanNumber, p.image_url, caption);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: caption,
            step: user.step,
            type: 'image',
            extra: { image_url: p.image_url }
          });
          await new Promise(r => setTimeout(r, 1500));
          const buttonPayload = {
            messaging_product: 'whatsapp',
            to: cleanNumber,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: 'Quiero este 👆' },
              action: {
                buttons: [
                  {
                    type: 'reply',
                    reply: {
                      id: String(p.id),
                      title: 'Agregar al carrito'
                    }
                  }
                ]
              }
            }
          };
          await whatsappService.sendWhatsAppRawMessage(buttonPayload);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: 'Botón: Agregar al carrito',
            step: user.step,
            type: 'button',
            extra: { payload: buttonPayload }
          });
        }
        if (endIdx < products.length) {
          const verMasPayload = {
            messaging_product: 'whatsapp',
            to: cleanNumber,
            type: 'interactive',
            interactive: {
              type: 'button',
              body: { text: '¿Quieres ver más productos?' },
              action: {
                buttons: [
                  {
                    type: 'reply',
                    reply: {
                      id: 'VER_MAS_PRODUCTOS',
                      title: 'Ver más'
                    }
                  }
                ]
              }
            }
          };
          await whatsappService.sendWhatsAppRawMessage(verMasPayload);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: 'Botón: Ver más productos',
            step: user.step,
            type: 'button',
            extra: { payload: verMasPayload }
          });
          user.product_page += 1;
          return res.json({ reply: 'Mostrando más productos...' });
        } else {
          user.product_page = 0;
          return res.json({ reply: 'Todos los productos enviados' });
        }
      } else if (isProductId) {
        // AGREGAR AL CARRITO: forzar step 'choosing' para asegurar procesamiento correcto
        const { getUserState } = require('../services/cartService');
        const user = getUserState(cleanNumber);
        user.step = 'choosing';
        reply = handleUserMessage(cleanNumber, message);
        console.log('REPLY:', reply, typeof reply);
        if (!reply) return res.sendStatus(200);
        // Log para depuración del objeto reply
        console.log('[DEBUG][reply tipo y valor][isProductId]', typeof reply, JSON.stringify(reply));
        if (typeof reply === 'object' && reply.generatePayment) {
          // (opcional: lógica de pago inmediato si aplica)
        } else if (typeof reply === 'object' && reply.showPaymentButton) {
          // 1. Enviar mensaje resumen
          await whatsappService.sendWhatsAppMessage(cleanNumber, reply.text);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: reply.text,
            step: user.step,
            type: 'text'
          });
          // 2. Enviar imágenes de los productos elegidos
          for (const p of user.cart) {
            await new Promise(r => setTimeout(r, 1200));
            await whatsappService.sendWhatsAppImage(cleanNumber, p.image_url, '');
            logMessage({
              user_id: cleanNumber,
              role: 'bot',
              message: '',
              step: user.step,
              type: 'image',
              extra: { image_url: p.image_url }
            });
          }
          // 3. Esperar antes de enviar el mensaje de pago
          await new Promise(r => setTimeout(r, 1500));
          // 4. Generar el link de pago y enviar mensaje final
          const sorted = [...user.cart].sort((a, b) => b.price - a.price);
          const total = (sorted[0].price + sorted[1].price + sorted[2].price).toFixed(2);
          const { createPaymentLink } = require('../services/mercadoPagoService');
          try {
            const title = 'Combo 4x3 Relojes Curren';
            const paymentLink = await createPaymentLink({ title, price: Number(total) });
            const finalMsg =
              '✔️ Envío rápido\n' +
              '✔️ Pago seguro con Mercado Pago\n' +
              '✔️ Garantía incluida\n\n' +
              '🔥 Tu paquete ya está listo\n' +
              'Paga aquí 👇\n' +
              '💡 Puedes pagar con tarjeta o efectivo (OXXO)'+
              '(Disponible por 3 días)\n' +
              paymentLink;
            await whatsappService.sendWhatsAppMessage(cleanNumber, finalMsg);
            logMessage({
              user_id: cleanNumber,
              role: 'bot',
              message: finalMsg,
              step: user.step,
              type: 'payment_link',
              extra: { paymentLink }
            });
            // Resetear carrito solo después de enviar el link
            const { resetCart } = require('../services/cartService');
            resetCart(cleanNumber);
            return res.json({ reply: finalMsg });
          } catch (err) {
            const errMsg = 'Ocurrió un error generando el link de pago. Intenta más tarde.';
            await whatsappService.sendWhatsAppMessage(cleanNumber, errMsg);
            logMessage({
              user_id: cleanNumber,
              role: 'bot',
              message: errMsg,
              step: user.step,
              type: 'text'
            });
            return res.json({ reply: errMsg });
          }
        } else if (typeof reply === 'object' && reply.text) {
          const resp = await whatsappService.sendWhatsAppMessage(cleanNumber, reply.text);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: reply.text,
            step: user.step,
            type: 'text'
          });
          console.log('WhatsApp API response:', resp);
        } else if (typeof reply === 'string') {
          const resp = await whatsappService.sendWhatsAppMessage(cleanNumber, reply);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: reply,
            step: user.step,
            type: 'text'
          });
          console.log('WhatsApp API response:', resp);
        }
        return res.json({ reply });
      } else {
        // ================= FLUJO NORMAL =================
        reply = handleUserMessage(cleanNumber, message);
        if (!reply) return res.sendStatus(200);
        // Log para depuración del objeto reply
        console.log('[DEBUG][reply tipo y valor]', typeof reply, JSON.stringify(reply));
        // Si el reply es objeto con generatePayment, generar link de pago
        if (typeof reply === 'object' && reply.generatePayment) {
          const { getUserState } = require('../services/cartService');
          const user = getUserState(cleanNumber);
          // Calcular total (3 más caros)
          const sorted = [...user.cart].sort((a, b) => b.price - a.price);
          const total = sorted[0].price + sorted[1].price + sorted[2].price;
          const { createPaymentLink } = require('../services/mercadoPagoService');
          try {
            const title = 'Combo 4x3 Relojes Curren';
            const paymentLink = await createPaymentLink({ title, price: total });
            const paymentMsg = `✔️ Envío rápido\n✔️ Pago seguro con Mercado Pago\n✔️ Garantía incluida\n\n🔥 Tu paquete ya quedó listo\n\nAquí está tu link 👇 tu link de pago: ${paymentLink}`;
            await whatsappService.sendWhatsAppMessage(cleanNumber, paymentMsg);
            logMessage({
              user_id: cleanNumber,
              role: 'bot',
              message: paymentMsg,
              step: user.step,
              type: 'payment_link',
              extra: { paymentLink }
            });
            // Resetear carrito solo después de enviar el link
            const { resetCart } = require('../services/cartService');
            resetCart(cleanNumber);
            return res.json({ reply: paymentMsg });
          } catch (err) {
            const errMsg = 'Ocurrió un error generando el link de pago. Intenta más tarde.';
            await whatsappService.sendWhatsAppMessage(cleanNumber, errMsg);
            logMessage({
              user_id: cleanNumber,
              role: 'bot',
              message: errMsg,
              step: user.step,
              type: 'text'
            });
            return res.json({ reply: errMsg });
          }
        } else if (typeof reply === 'object' && reply.showPaymentButton) {
          await whatsappService.sendWhatsAppMessage(cleanNumber, reply.text);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: reply.text,
            step: user.step,
            type: 'text'
          });
          // Esperar 1.5 segundos antes de enviar el botón interactivo
          await new Promise(r => setTimeout(r, 1500));
          console.log('[BOT] Enviando botón de pago interactivo...');
          try {
            const buttonPayload = {
              messaging_product: 'whatsapp',
              to: cleanNumber,
              type: 'interactive',
              interactive: {
                type: 'button',
                body: { text: '🔥 Tu paquete ya quedó listo\n\nTe dejo tu link de pago seguro aquí 👇\n(Disponible por 3 días)' },
                action: {
                  buttons: [
                    {
                      type: 'reply',
                      reply: {
                        id: 'GENERAR_LINK_PAGO',
                        title: 'Generar link de pago'
                      }
                    }
                  ]
                }
              }
            };
            const respButton = await whatsappService.sendWhatsAppRawMessage(buttonPayload);
            logMessage({
              user_id: cleanNumber,
              role: 'bot',
              message: 'Botón: Generar link de pago',
              step: user.step,
              type: 'button',
              extra: { payload: buttonPayload }
            });
            console.log('[WhatsApp API][sendWhatsAppRawMessage] Pago:', JSON.stringify(respButton));
          } catch (err) {
            console.error('[ERROR][sendWhatsAppRawMessage] Pago:', err);
          }
          console.log('[BOT] Botón de pago enviado (o intento realizado).');
          return res.json({ reply: reply.text });
        } else if (
          typeof reply === 'string' &&
          reply.includes('🔥 Promo')
        ) {
          return res.json({ reply: 'Mensaje bloqueado' });
        } else {
          const msgToSend = typeof reply === 'object' ? reply.text : reply;
          await whatsappService.sendWhatsAppMessage(cleanNumber, msgToSend);
          logMessage({
            user_id: cleanNumber,
            role: 'bot',
            message: msgToSend,
            step: user.step,
            type: 'text'
          });
        }
      }

    } 
    // ================= LOCAL =================
    else {
      reply = handleUserMessage(user_id, message);
    }

    res.json({ reply });

  } catch (e) {
    console.error('ERROR:', e);
    res.status(500).json({ error: e.message });
  }
});

// ================= VERIFY TOKEN =================
router.get('/universal-webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'miverificacionsupersecreta';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

module.exports = router;