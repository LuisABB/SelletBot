# SellerBot MVP

Bot de ventas automatizado para WhatsApp con promo 4x3, carrito, integración Mercado Pago y logging avanzado.

## Características principales

- Flujo de venta 4x3: El usuario elige 4 relojes y paga solo 3.
- Catálogo de productos con imágenes y botones interactivos.
- Carrito de compras por usuario (en memoria).
- Integración con WhatsApp Cloud API (envío de texto, imágenes, botones).
- Generación de links de pago Mercado Pago.
- Registro detallado de todas las interacciones en logs.json (mensajes, imágenes, botones, links, etc.).

# Instalación y configuración

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
  MONGODB_URI=...              # Cadena de conexión MongoDB
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
- `GET /logs` — Descarga el archivo `logs.json` con el historial de interacciones.

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

## Integración MongoDB

El bot utiliza MongoDB para persistencia de usuarios, conversaciones y órdenes. Configura la variable de entorno `MONGODB_URI` en tu `.env`.

### Colecciones principales

- **users**: Guarda cada usuario de WhatsApp con su número, nombre, estado y métricas.
- **conversations**: Estado conversacional y contexto por usuario.
- **orders**: Historial de pedidos, productos, total, estado y link de pago.

### Ejemplo de documento `users`
```json
{
  "_id": ObjectId,
  "phone": "525512345678",
  "name": "Nombre Perfil",
  "status": "lead" | "prospecto" | "cliente" | "recurrente",
  "metrics": {
    "total_orders": 1,
    "total_spent": 2108.94,
    "last_order_date": "2026-04-04T00:00:00Z"
  },
  "created_at": "2026-04-04T00:00:00Z"
}
```

### Ejemplo de documento `conversations`
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "phone": "525512345678",
  "state": "3-producto_seleccionado",
  "context": {
    "cart": [ { "product_id": 9882, "quantity": 1 } ],
    "order_id": ObjectId
  },
  "last_message_at": "2026-04-04T00:00:00Z"
}
```

### Ejemplo de documento `orders`
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "products": [ { "product_id": 9882, "price": 763.96, "quantity": 1 } ],
  "total": 2108.94,
  "status": "pending" | "paid",
  "payment_link": "https://...",
  "created_at": "2026-04-04T00:00:00Z"
}
```

## Taxonomía de estados conversacionales

- `inicio`: Usuario inicia o reinicia el flujo.
- `viendo_catalogo`: Navegando productos.
- `producto_seleccionado`: Seleccionando/agregando productos al carrito.
- `checkout`: Estado intermedio antes de pago.
- `pagado`: Pedido pagado.
- `text`: Mensaje libre o sin contexto relevante.

> El estado y contexto se actualizan automáticamente y bloquean duplicados o flujos inconsistentes.

## Automatización de status de usuario

- `lead`: Usuario nuevo.
- `prospecto`: Interactuó pero no ha comprado.
- `cliente`: Realizó su primer compra.
- `recurrente`: Más de una compra.

El status se actualiza automáticamente según la interacción y órdenes.

---

Listo para conectar a WhatsApp Cloud API y Mercado Pago. Puedes probar el flujo con Postman, curl o integrando el webhook en Facebook Developers.
