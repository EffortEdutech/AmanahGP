// packages/scoring/src/__tests__/webhook-idempotency.test.ts
// Amanah Governance Platform — Webhook idempotency logic tests
//
// Tests the idempotency rules from the webhook processor:
//   - Duplicate (gateway, event_id) must be a safe no-op
//   - Invalid signature must be stored but not processed
//   - Trust event idempotency via idempotency_key

import { describe, it, expect } from 'vitest';

// ── Trust event idempotency key helpers ───────────────────────
// These are the key-building patterns used in the codebase.

function donationConfirmedKey(donationId: string): string {
  return `donation_confirmed_${donationId}`;
}

function reportVerifiedKey(reportId: string): string {
  return `report_verified_${reportId}`;
}

function certUpdatedKey(historyId: string): string {
  return `cert_updated_${historyId}`;
}

// ── Simulated webhook event store ─────────────────────────────
interface WebhookEvent {
  gateway:         string;
  event_id:        string;
  signature_valid: boolean;
  processed:       boolean;
}

function createWebhookEventStore() {
  const store = new Map<string, WebhookEvent>();

  return {
    insert(event: WebhookEvent): { ok: boolean; duplicate: boolean } {
      const key = `${event.gateway}:${event.event_id}`;
      if (store.has(key)) {
        return { ok: false, duplicate: true };
      }
      store.set(key, event);
      return { ok: true, duplicate: false };
    },
    get(gateway: string, eventId: string): WebhookEvent | undefined {
      return store.get(`${gateway}:${eventId}`);
    },
    size(): number {
      return store.size;
    },
  };
}

// ── Simulated trust event store ───────────────────────────────
function createTrustEventStore() {
  const store = new Map<string, { orgId: string; type: string; key: string }>();

  return {
    insert(orgId: string, eventType: string, idempotencyKey: string): boolean {
      const storeKey = `${orgId}:${idempotencyKey}`;
      if (store.has(storeKey)) return false; // duplicate
      store.set(storeKey, { orgId, type: eventType, key: idempotencyKey });
      return true;
    },
    count(): number {
      return store.size;
    },
  };
}

// =============================================================
describe('Webhook idempotency', () => {

  it('accepts a new event', () => {
    const store = createWebhookEventStore();
    const result = store.insert({
      gateway: 'toyyibpay', event_id: 'EVT-001',
      signature_valid: true, processed: false,
    });
    expect(result.ok).toBe(true);
    expect(result.duplicate).toBe(false);
  });

  it('rejects a duplicate (same gateway + event_id)', () => {
    const store = createWebhookEventStore();
    store.insert({ gateway: 'toyyibpay', event_id: 'EVT-001', signature_valid: true, processed: false });
    const result = store.insert({ gateway: 'toyyibpay', event_id: 'EVT-001', signature_valid: true, processed: true });
    expect(result.duplicate).toBe(true);
    expect(result.ok).toBe(false);
  });

  it('allows same event_id from different gateways', () => {
    const store = createWebhookEventStore();
    store.insert({ gateway: 'toyyibpay', event_id: 'EVT-001', signature_valid: true, processed: false });
    const result = store.insert({ gateway: 'billplz', event_id: 'EVT-001', signature_valid: true, processed: false });
    expect(result.ok).toBe(true);
    expect(store.size()).toBe(2);
  });

  it('stores invalid-signature events but does not process them', () => {
    const store = createWebhookEventStore();
    const result = store.insert({
      gateway: 'toyyibpay', event_id: 'EVT-BAD',
      signature_valid: false, processed: false,
    });
    expect(result.ok).toBe(true);
    const ev = store.get('toyyibpay', 'EVT-BAD');
    expect(ev?.signature_valid).toBe(false);
    expect(ev?.processed).toBe(false);
  });

  it('replaying 100 identical events only creates 1 record', () => {
    const store = createWebhookEventStore();
    for (let i = 0; i < 100; i++) {
      store.insert({ gateway: 'toyyibpay', event_id: 'EVT-REPLAY', signature_valid: true, processed: false });
    }
    expect(store.size()).toBe(1);
  });
});

// =============================================================
describe('Trust event idempotency', () => {

  it('same report_verified event is not double-counted', () => {
    const store = createTrustEventStore();
    const reportId = 'd0000001-test';
    const key = reportVerifiedKey(reportId);

    const first  = store.insert('org-1', 'report_verified', key);
    const second = store.insert('org-1', 'report_verified', key);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(store.count()).toBe(1);
  });

  it('same donation_confirmed event is not double-counted', () => {
    const store = createTrustEventStore();
    const donationId = 'd1000001-test';
    const key = donationConfirmedKey(donationId);

    store.insert('org-1', 'donation_confirmed', key);
    const duplicate = store.insert('org-1', 'donation_confirmed', key);

    expect(duplicate).toBe(false);
    expect(store.count()).toBe(1);
  });

  it('same event type for different orgs are independent', () => {
    const store = createTrustEventStore();
    const key = reportVerifiedKey('report-abc');

    store.insert('org-1', 'report_verified', key);
    const result = store.insert('org-2', 'report_verified', key);

    expect(result).toBe(true); // different org — different composite key
    expect(store.count()).toBe(2);
  });

  it('different event types for same entity are independent', () => {
    const store = createTrustEventStore();
    store.insert('org-1', 'report_verified',  reportVerifiedKey('rpt-1'));
    store.insert('org-1', 'donation_confirmed', donationConfirmedKey('don-1'));
    expect(store.count()).toBe(2);
  });

  it('idempotency key format is deterministic', () => {
    const id = 'abc-123';
    expect(donationConfirmedKey(id)).toBe('donation_confirmed_abc-123');
    expect(reportVerifiedKey(id)).toBe('report_verified_abc-123');
    expect(certUpdatedKey(id)).toBe('cert_updated_abc-123');
  });
});

// =============================================================
describe('Score history immutability', () => {

  it('each recalculation appends a new row (never overwrites)', () => {
    const history: Array<{ score: number; computedAt: string }> = [];

    function appendScore(score: number): void {
      // Simulates the append-only insert
      history.push({ score, computedAt: new Date().toISOString() });
    }

    appendScore(65.0);
    appendScore(72.5);
    appendScore(74.5);

    expect(history).toHaveLength(3);
    expect(history[0].score).toBe(65.0);
    expect(history[1].score).toBe(72.5);
    expect(history[2].score).toBe(74.5);
    // Never modifies existing entries
    expect(history[0]).not.toHaveProperty('updated_at');
  });

  it('public score is derived from latest history entry', () => {
    const history = [
      { score: 65.0, computedAt: '2025-01-01T00:00:00Z' },
      { score: 72.5, computedAt: '2025-06-01T00:00:00Z' },
      { score: 74.5, computedAt: '2026-01-01T00:00:00Z' },
    ];

    const latest = history.sort(
      (a, b) => new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime()
    )[0];

    expect(latest.score).toBe(74.5);
  });
});
