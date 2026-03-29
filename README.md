
# SellerBot MVP

Bot de ventas automatizado para WhatsApp con promo 4x3, carrito, integración Mercado Pago y logging avanzado.

## Características principales

- Flujo de venta 4x3: El usuario elige 4 relojes y paga solo 3.
- Catálogo de productos con imágenes y botones interactivos.
- Carrito de compras por usuario (en memoria).
- Integración con WhatsApp Cloud API (envío de texto, imágenes, botones).
- Generación de links de pago Mercado Pago.
- Registro detallado de todas las interacciones en logs.json (mensajes, imágenes, botones, links, etc.).

## Estructura del proyecto

- `index.js` — App principal y servidor Express.
- `routes/webhook.js` — Rutas de API y lógica de flujo conversacional.
- `services/botService.js` — Lógica de conversación y promo.
- `services/cartService.js` — Carrito y estado de usuario.
- `services/products.js` — Catálogo de productos (hardcodeado).
- `services/logger.js` — Registro de logs enriquecido.
- `services/whatsappService.js` — Envío de mensajes a WhatsApp Cloud API.
- `services/mercadoPagoService.js` — Generación de links de pago Mercado Pago.
- `logs.json` — Historial de interacciones.

## Instalación y configuración

1. Clona el repositorio y entra a la carpeta:
  ```bash
  git clone <repo_url>
  cd sellerBot
  ```
2. Instala dependencias:
  ```bash
  npm install
  ```
3. Crea un archivo `.env` con tus credenciales:
  ```env
  WHATSAPP_TOKEN=...           # Token de WhatsApp Cloud API
  WHATSAPP_PHONE_ID=...        # ID de teléfono de WhatsApp
  WHATSAPP_VERIFY_TOKEN=...    # Token de verificación webhook
  MERCADOPAGO_ACCESS_TOKEN=... # Token de Mercado Pago
  ```
4. Inicia el servidor:
  ```bash
  npm start
  ```
  El bot corre por defecto en el puerto 3000.

## Endpoints principales

- `POST /webhook` — Recibe `{ user_id, message }` y responde según el flujo 4x3 (útil para pruebas locales).
- `POST /universal-webhook` — Webhook universal para WhatsApp Cloud API (procesa mensajes, botones, imágenes, links, etc.).
- `POST /whatsapp-webhook` — Webhook simple para pruebas.

## Ejemplo de prueba con curl

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"user_id": "525536609217", "message": "hola"}'
```

## ¿Cómo funciona el flujo?

1. El usuario inicia escribiendo "hola" o similar.
2. El bot responde con la promo y muestra productos (imágenes + botón "Agregar al carrito").
3. El usuario agrega productos (máx. 4). El bot responde con el estado del carrito.
4. Al llegar a 4 productos, el bot muestra el resumen y un botón para generar link de pago.
5. El usuario recibe el link de pago Mercado Pago.

## Logging avanzado

Todos los mensajes enviados y recibidos (texto, imágenes, botones, links, etc.) se registran en `logs.json` con:

- `user_id`, `role` (user/bot), `message`, `step`, `type` (text, image, button, payment_link, etc.), `extra`, `timestamp`.

## Dependencias principales

- express
- body-parser
- dotenv
- node-fetch
- mercadopago

## Notas y recomendaciones

- El carrito y el estado de usuario se mantienen en memoria (no persistente).
- El catálogo de productos está hardcodeado en `services/products.js`.
- Para producción, se recomienda usar una base de datos y desplegar en un entorno seguro.

---

Listo para conectar a WhatsApp Cloud API y Mercado Pago. Puedes probar el flujo con Postman, curl o integrando el webhook en Facebook Developers.
