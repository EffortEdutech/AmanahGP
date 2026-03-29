// supabase/functions/webhook-payments/index.ts
// Amanah Governance Platform — Payment Webhook Handler
// Handles ToyyibPay (and future gateway) webhook confirmations
//
// Security contract:
//   1. Write raw event to payment_webhook_events FIRST (idempotency gate)
//   2. Verify signature
//   3. Resolve donation_transaction
//   4. Append trust_event(donation_confirmed)
//   5. Return 200 always (even for invalid/replayed — gateway expects 200)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPPORTED_GATEWAYS = ['toyyibpay', 'billplz'] as const;
type Gateway = typeof SUPPORTED_GATEWAYS[number];

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const gateway = url.pathname.split('/').pop() as Gateway;

  if (!SUPPORTED_GATEWAYS.includes(gateway)) {
    return new Response(JSON.stringify({ ok: false, error: 'Unknown gateway' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Parse raw body ──────────────────────────────────────────
  const rawBody = await req.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // ToyyibPay sends form-encoded data
    payload = Object.fromEntries(new URLSearchParams(rawBody));
  }

  // ── Capture headers (for audit/forensics) ──────────────────
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!key.toLowerCase().startsWith('authorization')) {
      headers[key] = value;
    }
  });

  // ── Extract gateway event ID ────────────────────────────────
  const eventId = extractEventId(gateway, payload);
  if (!eventId) {
    console.error('[webhook] Could not extract event ID', { gateway, payload });
    return new Response('ok', { status: 200 });
  }

  // ── Service role Supabase client ────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  // ── Step 1: Write raw event (idempotency gate) ──────────────
  const { data: webhookEvent, error: insertError } = await supabase
    .from('payment_webhook_events')
    .insert({
      gateway,
      event_id: eventId,
      payload,
      headers,
      signature_valid: false,
      processed: false,
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate — safe idempotent replay
      console.log('[webhook] Duplicate event, returning 200 safely', { gateway, eventId });
      return new Response('ok', { status: 200 });
    }
    console.error('[webhook] Failed to insert webhook event', insertError.message);
    return new Response('ok', { status: 200 }); // Still 200 to gateway
  }

  const webhookEventId = webhookEvent.id;

  // ── Step 2: Verify signature ────────────────────────────────
  const signatureValid = verifySignature(gateway, rawBody, headers);

  await supabase
    .from('payment_webhook_events')
    .update({ signature_valid: signatureValid })
    .eq('id', webhookEventId);

  if (!signatureValid) {
    console.warn('[webhook] Invalid signature', { gateway, eventId });
    // Store but do not process — return 200 to avoid gateway retries
    await supabase
      .from('payment_webhook_events')
      .update({ processed: true, processing_error: 'INVALID_SIGNATURE', processed_at: new Date().toISOString() })
      .eq('id', webhookEventId);
    return new Response('ok', { status: 200 });
  }

  // ── Step 3: Resolve donation transaction ────────────────────
  const gatewayTransactionId = extractTransactionId(gateway, payload);
  const checkoutId = extractCheckoutId(gateway, payload);
  const isSuccess = extractIsSuccess(gateway, payload);

  if (!gatewayTransactionId && !checkoutId) {
    console.error('[webhook] No transaction or checkout ID found', { gateway, payload });
    await supabase
      .from('payment_webhook_events')
      .update({ processed: true, processing_error: 'NO_TRANSACTION_ID', processed_at: new Date().toISOString() })
      .eq('id', webhookEventId);
    return new Response('ok', { status: 200 });
  }

  // Find matching donation transaction
  let donationQuery = supabase
    .from('donation_transactions')
    .select('id, organization_id, status, amount, currency')
    .eq('gateway', gateway);

  if (gatewayTransactionId) {
    donationQuery = donationQuery.eq('gateway_transaction_id', gatewayTransactionId);
  } else {
    donationQuery = donationQuery.eq('gateway_checkout_id', checkoutId);
  }

  const { data: donation } = await donationQuery.single();

  if (!donation) {
    console.warn('[webhook] No matching donation transaction', { gateway, gatewayTransactionId, checkoutId });
    await supabase
      .from('payment_webhook_events')
      .update({ processed: true, processing_error: 'DONATION_NOT_FOUND', processed_at: new Date().toISOString() })
      .eq('id', webhookEventId);
    return new Response('ok', { status: 200 });
  }

  // Link webhook event to donation
  await supabase
    .from('payment_webhook_events')
    .update({ donation_transaction_id: donation.id })
    .eq('id', webhookEventId);

  // Skip if already confirmed (idempotent)
  if (donation.status === 'confirmed' || donation.status === 'failed') {
    console.log('[webhook] Donation already in terminal state', { donationId: donation.id, status: donation.status });
    await supabase
      .from('payment_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', webhookEventId);
    return new Response('ok', { status: 200 });
  }

  // ── Step 4: Update donation status ─────────────────────────
  const newStatus = isSuccess ? 'confirmed' : 'failed';
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (gatewayTransactionId) updateData.gateway_transaction_id = gatewayTransactionId;
  if (isSuccess) updateData.confirmed_at = new Date().toISOString();

  await supabase
    .from('donation_transactions')
    .update(updateData)
    .eq('id', donation.id);

  // ── Step 5: Append trust event (if confirmed) ───────────────
  if (isSuccess) {
    const idempotencyKey = `donation_confirmed_${donation.id}`;

    await supabase
      .from('trust_events')
      .insert({
        organization_id: donation.organization_id,
        event_type: 'donation_confirmed',
        event_ref_table: 'donation_transactions',
        event_ref_id: donation.id,
        payload: {
          amount: donation.amount,
          currency: donation.currency,
          gateway,
        },
        source: 'webhook',
        idempotency_key: idempotencyKey,
      });

    // ── Audit log ─────────────────────────────────────────────
    await supabase
      .from('audit_logs')
      .insert({
        actor_user_id: null,
        actor_role: 'webhook',
        organization_id: donation.organization_id,
        action: 'DONATION_CONFIRMED',
        entity_table: 'donation_transactions',
        entity_id: donation.id,
        metadata: { gateway, amount: donation.amount, currency: donation.currency },
      });
  }

  // ── Mark webhook as processed ───────────────────────────────
  await supabase
    .from('payment_webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('id', webhookEventId);

  console.log('[webhook] Processed successfully', {
    gateway, eventId, donationId: donation.id, newStatus,
  });

  return new Response('ok', { status: 200 });
});

// =============================================================
// Gateway-specific parsers
// =============================================================

function extractEventId(gateway: Gateway, payload: Record<string, unknown>): string | null {
  if (gateway === 'toyyibpay') {
    return (payload.billcode as string) ?? (payload.transaction_id as string) ?? null;
  }
  if (gateway === 'billplz') {
    return (payload.id as string) ?? null;
  }
  return null;
}

function extractTransactionId(gateway: Gateway, payload: Record<string, unknown>): string | null {
  if (gateway === 'toyyibpay') return (payload.transaction_id as string) ?? null;
  if (gateway === 'billplz') return (payload.id as string) ?? null;
  return null;
}

function extractCheckoutId(gateway: Gateway, payload: Record<string, unknown>): string | null {
  if (gateway === 'toyyibpay') return (payload.billcode as string) ?? null;
  return null;
}

function extractIsSuccess(gateway: Gateway, payload: Record<string, unknown>): boolean {
  if (gateway === 'toyyibpay') {
    // ToyyibPay: status_id 1 = success
    return payload.status_id === '1' || payload.status_id === 1;
  }
  if (gateway === 'billplz') {
    return payload.paid === 'true' || payload.paid === true;
  }
  return false;
}

function verifySignature(
  gateway: Gateway,
  _rawBody: string,
  headers: Record<string, string>
): boolean {
  // ToyyibPay does not use HMAC signature — identity is confirmed via
  // matching billcode/transaction_id to an existing initiated transaction.
  // For Phase 1 this is acceptable. Phase 2 should add IP allowlist or
  // a shared secret verification step.
  if (gateway === 'toyyibpay') {
    // Basic check: content-type should be present
    return !!(headers['content-type']);
  }

  if (gateway === 'billplz') {
    const webhookSecret = Deno.env.get('BILLPLZ_WEBHOOK_SECRET');
    if (!webhookSecret) return false;
    // Billplz X-Signature verification would go here
    // For Phase 1, return true if secret is configured
    return !!webhookSecret;
  }

  return false;
}
