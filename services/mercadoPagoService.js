

const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

const NOTIFICATION_URL = 'https://relojescurrenmexico.com.mx/webhook/mercadopago';

async function createPaymentLink({ title, price, orderId }) {
  try {
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            title,
            quantity: 1,
            currency_id: 'MXN',
            unit_price: Number(price)
          }
        ],
        back_urls: {
          success: 'https://relojescurrenmexico.com.mx/success',
          failure: 'https://relojescurrenmexico.com.mx/failure',
          pending: 'https://relojescurrenmexico.com.mx/pending'
        },
        auto_return: 'approved',
        external_reference: orderId,
        notification_url: NOTIFICATION_URL
      }
    });
    return response.init_point;
  } catch (error) {
    console.error('Error creando link de pago:', error);
    throw error;
  }
}

module.exports = { createPaymentLink };