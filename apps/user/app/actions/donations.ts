// apps/user/app/actions/donations.ts
// AmanahHub — Donation server actions
// All donation initiation is server-side — never client-side

'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { AUDIT_ACTIONS, PAYMENT_GATEWAYS } from '@agp/config';

interface InitiateDonationParams {
  organizationId:    string;
  projectId?:        string;
  amount:            number;
  platformFeeAmount: number;
  currency:          string;
  donorEmail?:       string;
}

interface InitiateDonationResult {
  ok:                    boolean;
  donationTransactionId?: string;
  checkoutUrl?:          string;
  error?:                string;
}

/**
 * Creates a donation transaction record and returns a checkout URL.
 * The platform never holds funds — money goes direct-to-charity via gateway.
 */
export async function initiateDonation(
  params: InitiateDonationParams
): Promise<InitiateDonationResult> {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // ── Get current user (optional — guest donations allowed) ───
  const { data: { user } } = await supabase.auth.getUser();

  let donorUserId: string | null = null;
  if (user) {
    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_provider_user_id', user.id)
      .single();
    donorUserId = userRecord?.id ?? null;
  }

  // ── Create donation_transaction BEFORE redirect ─────────────
  // This ensures we can reconcile even if the user never returns
  const { data: donation, error: insertError } = await serviceClient
    .from('donation_transactions')
    .insert({
      organization_id:      params.organizationId,
      project_id:           params.projectId ?? null,
      donor_user_id:        donorUserId,
      donor_email:          params.donorEmail ?? null,
      amount:               params.amount,
      platform_fee_amount:  params.platformFeeAmount,
      currency:             params.currency,
      status:               'initiated',
      gateway:              PAYMENT_GATEWAYS.TOYYIBPAY,
    })
    .select('id')
    .single();

  if (insertError || !donation) {
    return { ok: false, error: 'Failed to create donation record' };
  }

  // ── Audit log ────────────────────────────────────────────────
  await writeAuditLog({
    actorUserId:    donorUserId,
    actorRole:      'donor',
    organizationId: params.organizationId,
    action:         AUDIT_ACTIONS.DONATION_INITIATED,
    entityTable:    'donation_transactions',
    entityId:       donation.id,
    metadata:       { amount: params.amount, currency: params.currency, gateway: PAYMENT_GATEWAYS.TOYYIBPAY },
  });

  // ── Create ToyyibPay checkout ─────────────────────────────
  const checkoutResult = await createToyyibPayCheckout({
    donationTransactionId: donation.id,
    amount: params.amount,
    currency: params.currency,
    donorEmail: params.donorEmail,
    organizationId: params.organizationId,
  });

  if (!checkoutResult.ok) {
    return { ok: false, error: checkoutResult.error };
  }

  // ── Update with checkout ID ───────────────────────────────
  await serviceClient
    .from('donation_transactions')
    .update({
      gateway_checkout_id: checkoutResult.checkoutId,
      status: 'pending',
    })
    .eq('id', donation.id);

  return {
    ok:                    true,
    donationTransactionId: donation.id,
    checkoutUrl:           checkoutResult.checkoutUrl,
  };
}

// ── ToyyibPay checkout creation ──────────────────────────────
async function createToyyibPayCheckout(params: {
  donationTransactionId: string;
  amount: number;
  currency: string;
  donorEmail?: string;
  organizationId: string;
}): Promise<{ ok: boolean; checkoutId?: string; checkoutUrl?: string; error?: string }> {
  const baseUrl = process.env.TOYYIBPAY_BASE_URL ?? 'https://dev.toyyibpay.com';
  const secretKey = process.env.TOYYIBPAY_USER_SECRET_KEY;
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200';

  if (!secretKey || !categoryCode) {
    console.error('[donation] ToyyibPay credentials not configured');
    return { ok: false, error: 'Payment gateway not configured' };
  }

  try {
    const body = new URLSearchParams({
      userSecretKey:      secretKey,
      categoryCode:       categoryCode,
      billName:           'Amanah Donation',
      billDescription:    `Donation - AGP-${params.donationTransactionId.slice(0, 8)}`,
      billPriceSetting:   '1',
      billPayorInfo:      '1',
      billAmount:         String(Math.round(params.amount * 100)), // ToyyibPay uses cents
      billReturnUrl:      `${appUrl}/donate/receipt/${params.donationTransactionId}`,
      billCallbackUrl:    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/webhook-payments/toyyibpay`,
      billTo:             params.donorEmail ?? 'Donor',
      billEmail:          params.donorEmail ?? '',
      billPhone:          '',
      billSplitPayment:   '0',
      billSplitPaymentArgs: '',
      billPaymentChannel: '0',
      billContentEmail:   'Thank you for your donation via AmanahHub.',
      billChargeToCustomer: '0',
      billExternalReferenceNo: params.donationTransactionId,
    });

    const response = await fetch(`${baseUrl}/index.php/api/createBill`, {
      method: 'POST',
      body,
    });

    if (!response.ok) {
      return { ok: false, error: `ToyyibPay API error: ${response.status}` };
    }

    const result = await response.json() as Array<{ BillCode?: string; Error?: string }>;

    if (!result[0]?.BillCode) {
      return { ok: false, error: result[0]?.Error ?? 'No bill code returned' };
    }

    const billCode = result[0].BillCode;

    return {
      ok:          true,
      checkoutId:  billCode,
      checkoutUrl: `${baseUrl}/${billCode}`,
    };
  } catch (err) {
    console.error('[donation] ToyyibPay checkout error:', err);
    return { ok: false, error: 'Failed to create checkout session' };
  }
}
