# Índice maestro — rutas API

Listado de handlers bajo `src/app/api`. Los métodos se obtienen del export en cada `route.ts`.  
`[...nextauth]` expone **GET** y **POST** vía el handler de NextAuth (no usan la firma `export async function GET`).

| Métodos | Ruta |
|---------|------|
| POST | `/api/admin/auth/sign-in` |
| POST | `/api/admin/auth/sign-out` |
| POST | `/api/admin/create-direct` |
| POST | `/api/admin/login-alert` |
| POST | `/api/admin/seed-categories` |
| GET, POST | `/api/admin/seed-reputation` |
| POST | `/api/admin/setup` |
| POST | `/api/ai/auto-reply` |
| POST | `/api/ai/blog` |
| POST | `/api/ai/compare` |
| POST | `/api/ai/enhance-listing` |
| POST | `/api/ai/marketing` |
| POST | `/api/ai/notifications` |
| POST | `/api/ai/recommendations` |
| POST | `/api/ai/reviews` |
| GET, POST | `/api/auth/[...nextauth]` |
| POST | `/api/auth/register` |
| GET, POST | `/api/campaigns` |
| GET, PATCH, DELETE | `/api/campaigns/{id}` |
| GET, POST, PATCH, DELETE | `/api/cart` |
| GET | `/api/categories` |
| GET, POST | `/api/chat` |
| POST | `/api/checkout/mp` |
| POST | `/api/shipping/zipnova/quote` |
| GET, POST | `/api/claims` |
| GET, PUT | `/api/claims/{id}` |
| POST | `/api/claims/{id}/messages` |
| GET, POST | `/api/coupons` |
| GET | `/api/coupons/public` |
| GET | `/api/dashboard/compras` |
| GET | `/api/dashboard/faq` |
| GET, DELETE | `/api/dashboard/favoritos` |
| GET | `/api/dashboard/live` |
| GET | `/api/dashboard/metrics` |
| GET | `/api/dashboard/opiniones` |
| GET | `/api/dashboard/orders` |
| GET, POST, PATCH, DELETE | `/api/dashboard/products` |
| GET | `/api/dashboard/questions` |
| GET | `/api/dashboard/summary` |
| GET, POST, PATCH | `/api/dashboard/support` |
| GET, POST | `/api/dashboard/support/messages` |
| GET, HEAD | `/api/health` |
| POST | `/api/import-products` |
| POST | `/api/meli/ads/apply` |
| GET | `/api/meli/ads/campaign-items` |
| GET | `/api/meli/ads/snapshot` |
| GET, POST | `/api/meli/import` |
| GET | `/api/meli/local-unpublished` |
| GET, POST | `/api/meli/notifications` |
| GET | `/api/meli/oauth/authorize` |
| GET | `/api/meli/oauth/callback` |
| GET | `/api/meli/promotions` |
| POST | `/api/meli/promotions/sync` |
| POST | `/api/meli/push-items` |
| GET | `/api/meli/status` |
| GET, POST | `/api/meta/webhook` |
| POST | `/api/meta/whatsapp/connect` |
| POST | `/api/meta/whatsapp/send` |
| GET, PATCH, DELETE | `/api/notifications` |
| GET | `/api/offers` |
| POST, GET | `/api/orders` |
| GET, POST | `/api/products` |
| GET, PUT, DELETE | `/api/products/{id}` |
| GET | `/api/products/carousel` |
| GET | `/api/products/my` |
| GET, POST, DELETE | `/api/products/wholesale` |
| GET, POST | `/api/questions` |
| PUT, DELETE | `/api/questions/{id}` |
| POST, DELETE | `/api/questions/upload` |
| GET | `/api/reputation` |
| POST | `/api/search/image` |
| GET | `/api/search/listings` |
| POST | `/api/search/smart` |
| GET | `/api/search/suggestions` |
| POST, PUT | `/api/seller/boost` |
| GET | `/api/seller/collaborators` |
| POST | `/api/seller/collaborators/invite` |
| DELETE | `/api/seller/collaborators/invite/{id}` |
| GET | `/api/seller/dashboard` |
| GET | `/api/seller/payment-gateway/mercadopago/auth` |
| GET | `/api/seller/payment-gateway/mercadopago/callback` |
| POST | `/api/seller/payment-gateway/mercadopago/create-preference` |
| POST | `/api/seller/payment-gateway/mercadopago/disconnect` |
| GET | `/api/seller/payment-gateway/mercadopago/status` |
| GET, POST | `/api/shipments` |
| PATCH, POST | `/api/shipments/{id}` |
| POST, GET | `/api/subscriptions` |
| POST, GET | `/api/test/whatsapp` |
| GET, POST, DELETE | `/api/user/access-key` |
| GET | `/api/user/me` |
| GET, POST | `/api/variations` |
| PUT, DELETE | `/api/variations/{id}` |
| POST, GET | `/api/webhooks/mercadopago` |

**Total:** la tabla debe mantenerse al día con `src/app/api/**/route.ts`; el número de archivos en el repo puede variar (sincronizar al agregar o quitar rutas).
