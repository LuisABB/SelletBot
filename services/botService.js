const products = require('./products');
const { getUserState, addToCart, resetCart } = require('./cartService');
const { logMessage } = require('./logger');


function handleUserMessage(user_id, message) {
  const user = getUserState(user_id);
  let response = '';

  logMessage({ user_id, role: 'user', message, step: user.step });

  const RESET_WORDS = ['hola', 'buenas', 'quiero información', 'información', 'Ayuda','Tienda','Precio','Ola','Buen día', 'inicio'];
  const normalizedMsg = message.trim().toLowerCase();

  if ((user.step === 'start' || user.step === 'choosing') && RESET_WORDS.includes(normalizedMsg)) {
    user.step = 'choosing';
    user.cart = [];
    user.cart_count = 0;
    response = '🔥 PROMO 4x3 por tiempo limitado\n\nTe llevas 4 relojes y uno va GRATIS\n\n👇 Elige el primero';
  } else if (user.step === 'choosing') {
    const prodId = parseInt(message.trim());
    const product = products.find(p => p.id === prodId);
    if (!product) {
      response = 'No encontré ese producto. Elige uno de la lista.';
    } else {
      addToCart(user_id, product);
      if (user.cart_count < 4) {
        if (user.cart_count === 1) response = 'Llevas 1 de 4 👌';
        else if (user.cart_count === 2) response = '🔥 Ya tienes 2 relojes apartados\nTe faltan 2 para llevarte UNO GRATIS';
        else if (user.cart_count === 3) response = '🚨 Ya casi es tuyo el GRATIS\nSolo elige 1 más y te lo regalamos';
        response += '\n\nElige tu siguiente reloj 🫡';
      } else if (user.cart_count === 4) {
        user.step = 'checkout';
        const sorted = [...user.cart].sort((a, b) => b.price - a.price);
        const total = (sorted[0].price + sorted[1].price + sorted[2].price).toFixed(2);
        const resumen = user.cart.map(p => `✔️ Modelo ${p.name}${p.variant ? ' (' + p.variant + ')' : ''}`).join('\n');
        response = {
          text: `🔥 Este es tu paquete listo:\n\n${resumen}\n\n💰 Total con promo aplicada: $${total}\n🎁 Incluye 1 reloj GRATIS`,
          showPaymentButton: true
        };
      }
    }
  } else if (user.step === 'checkout') {
    if (message.trim() === 'GENERAR_LINK_PAGO') {
      response = { generatePayment: true };
    } else {
      response = { text: 'Presiona el botón para generar tu link de pago.', showPaymentButton: true };
    }
  }

  logMessage({ user_id, role: 'bot', message: typeof response === 'object' ? JSON.stringify(response) : response, step: user.step });
  return response;
}

module.exports = { handleUserMessage };