# payment-service

Bounded context: Purchases, Stripe Connect onboarding, webhooks, revenue split, and `PurchaseCompleted` events.

## Endpoints

- `POST /v1/purchases` — Create purchase and Stripe PaymentIntent (or mock client secret in dev)
- `GET /v1/purchases/:id` — Get purchase by ID (owner or internal)
- `POST /v1/webhooks/stripe` — Stripe webhook handler (`payment_intent.succeeded`, idempotent)
- `GET /v1/partner/sales` — List partner sales (`x-user-id` + `x-partner-id`)
- `POST /v1/partner/stripe/onboard` — Create Stripe Connect account link
- `GET /health` — Health check (database + Redis)

## Flow

1. User requests purchase → service fetches sticker (catalog) and partner (identity).
2. PaymentIntent created with `application_fee_amount` and `transfer_data.destination` when Stripe is configured.
3. Webhook marks purchase as paid and publishes `PurchaseCompleted` to the `collection` BullMQ queue.
4. Collection service consumes the event and mints the sticker.

## Headers

| Header | Usage |
|--------|-------|
| `x-user-id` | Set by API gateway from JWT `sub` |
| `x-partner-id` | Set by API gateway from JWT `partnerId` |
| `x-internal-service-key` | Service-to-service calls |
| `x-correlation-id` | Request tracing |

## ADR

See [docs/ADR](./docs/ADR)
