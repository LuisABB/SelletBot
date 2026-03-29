# Changelog

Todas las modificaciones relevantes del proyecto SellerBot MVP.

## [1.0.0] - 2026-03-28
### Added
- Estructura inicial del bot con Express y endpoints `/webhook`, `/universal-webhook`, `/whatsapp-webhook`.
- Lógica de promo 4x3 y carrito de compras en memoria.
- Catálogo de productos hardcodeado con imágenes.
- Integración con WhatsApp Cloud API (envío de texto, imágenes, botones).
- Integración con Mercado Pago para generación de links de pago.
- Logging avanzado de todas las interacciones (texto, imágenes, botones, links, etc.) en `logs.json`.
- Normalización de números de usuario para evitar duplicados en logs.
- Registro explícito de clics en botones y mensajes enriquecidos.
- Documentación completa en README.md.

### Changed
- Mejora de logger para soportar tipos de mensaje y datos extra.
- Unificación de user_id en todos los logs.
- README ampliado con instrucciones, dependencias y flujo conversacional.

### Fixed
- Problemas de duplicidad de user_id por formato de número.
- Registro incompleto de logs para mensajes enriquecidos y botones.

---

Para futuras versiones, agregar persistencia de usuarios y catálogo dinámico.
