# ADR-003 — Payment Gateway

**Status:** Decided  
**Date:** 27 Mar 2026  
**Owner:** Darya Malak

---

## Decision
**Primary gateway: ToyyibPay.**  
**Future adapter: Billplz.**

## Rationale
- ToyyibPay supports Malaysian payment methods (FPX, credit card) without complex onboarding
- Webhook-based confirmation model fits the non-custodial architecture
- Sandbox environment available for local development
- Billplz reserved as a secondary adapter — same interface, different provider

## Implementation Rule
The donation engine **must** be written behind a provider adapter interface:

```
interface PaymentProvider {
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyWebhookSignature(payload: string, headers: Record<string, string>): boolean;
  parseWebhookEvent(payload: string): ParsedWebhookEvent;
}
```

New gateways plug in without touching donation domain logic.

## Non-custodial Principle (Locked)
- Platform never holds funds
- `donation_transactions` records intent and confirmation only
- Money moves: Donor → ToyyibPay → Charity Bank Account

## Webhook Idempotency Rule
- Write to `payment_webhook_events` (gateway + event_id unique) **first**
- Then resolve `donation_transactions`
- Replay of same event_id is a safe no-op

## Consequences
- `TOYYIBPAY_USER_SECRET_KEY`, `TOYYIBPAY_CATEGORY_CODE`, `TOYYIBPAY_WEBHOOK_SECRET` are server-side only env vars
- Webhook handler lives in `supabase/functions/webhook-payments/`
- Checkout creation lives in a Server Action (never client-side)
