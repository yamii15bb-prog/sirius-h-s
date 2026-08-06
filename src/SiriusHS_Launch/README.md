# Sirius H&S — Launch Candidate 2.0

Plataforma base para invitaciones digitales inteligentes. Conserva la experiencia del prototipo y añade una API de producción inicial para cuentas, eventos, invitados, QR, validación y Premium.

## Requisitos
- Node.js 20 LTS o superior
- npm

## Desarrollo
1. Copia `.env.example` como `.env`.
2. Cambia `JWT_SECRET` por un secreto largo.
3. Ejecuta `npm install`.
4. Ejecuta `npm run dev`.
5. Abre `http://localhost:5173`.

## Producción web
- Configura las variables de entorno reales.
- Ejecuta `npm run build`.
- Ejecuta `NODE_ENV=production npm start`.
- Sirve detrás de HTTPS y un proxy/reverse proxy.

## Premium
El backend incluye una ruta de Checkout de Stripe y webhook. Debes crear el producto/precio real en Stripe y configurar `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` y `STRIPE_WEBHOOK_SECRET`. Para tiendas móviles se requiere además integrar la facturación de Google Play/App Store y sus comprobantes en el backend; este repositorio no inventa credenciales ni certificados de tiendas.

## Cámara
El lector de cámara del prototipo usa las APIs disponibles del navegador. En producción, la cámara requiere HTTPS (excepto localhost) y permiso del usuario.

## Datos
La demo original usa localStorage. El servidor incluido permite migrar progresivamente a una base SQLite. Para escala comercial se recomienda una base administrada y almacenamiento de objetos.

## Publicación
Antes de anunciarla como producto oficial debes completar: dominio/HTTPS, política de privacidad, términos, soporte, analítica, backups, base administrada, secretos de producción, configuración de pagos, cuentas de desarrollador y firma de las apps móviles.
