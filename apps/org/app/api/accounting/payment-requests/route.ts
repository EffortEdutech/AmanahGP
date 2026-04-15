// apps/org/app/api/accounting/payment-requests/route.ts
// Sprint 20 — Payment Requests API
// Handles: create | submit | review | approve | reject | mark_paid
//
// SoD enforcement: approve action checks created_by ≠ approver.
// Trust events are emitted via DB trigger on payment_requests UPDATE.

import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await request.json();
  const { action, requestId, orgId, amount,
          fundId, expenseAccountId, bankAccountId } = body;

  // Verify membership
  const { data: membership } = await service
    .from('org_members').select('org_role')
    .eq('organization_id', orgId).eq('user_id', platformUser.id)
    .eq('status', 'active').single();
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);

  // ── CREATE ───────────────────────────────────────────────────
  if (action === 'create') {
    const { requestNo, description, vendorName, referenceNo, paymentDate,
            isLargeTransaction, largeTransactionThreshold, projectId, currentUserId } = body;

    const { data, error } = await service
      .from('payment_requests')
      .insert({
        organization_id:           orgId,
        request_no:                requestNo,
        description,
        amount:                    body.amount,
        fund_id:                   fundId,
        expense_account_id:        expenseAccountId,
        bank_account_id:           bankAccountId,
        project_id:                projectId,
        vendor_name:               vendorName,
        reference_no:              referenceNo,
        payment_date:              paymentDate,
        is_large_transaction:      isLargeTransaction,
        large_transaction_threshold: largeTransactionThreshold,
        status:                    'draft',
        created_by_user_id:        platformUser.id,
      })
      .select('id').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id });
  }

  // All other actions require an existing request
  const { data: req } = await service
    .from('payment_requests').select('*')
    .eq('id', requestId).eq('organization_id', orgId).single();
  if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  // ── SUBMIT (draft → pending_review) ─────────────────────────
  if (action === 'submit') {
    if (req.status !== 'draft')
      return NextResponse.json({ error: 'Only draft requests can be submitted.' }, { status: 400 });

    const { error } = await service.from('payment_requests')
      .update({ status: 'pending_review', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Manager-only from here
  if (!isManager) return NextResponse.json({ error: 'Manager role required' }, { status: 403 });

  // ── REVIEW (pending_review → pending_approval) ───────────────
  if (action === 'review') {
    if (req.status !== 'pending_review')
      return NextResponse.json({ error: 'Request is not pending review.' }, { status: 400 });

    const { error } = await service.from('payment_requests')
      .update({
        status:               'pending_approval',
        reviewed_by_user_id:  platformUser.id,
        reviewed_at:          new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── APPROVE (pending_approval → approved) ────────────────────
  // DB trigger trg_emit_on_payment_approval fires here:
  //   - same user as creator → gov_payment_self_approved (-15 Governance)
  //   - different user → gov_payment_dual_approved (+4 Governance)
  if (action === 'approve') {
    if (req.status !== 'pending_approval')
      return NextResponse.json({ error: 'Request is not pending approval.' }, { status: 400 });

    // Check SoD — warn but do NOT block (trigger emits penalty event instead)
    const isSelfApproval = req.created_by_user_id === platformUser.id;

    const { error } = await service.from('payment_requests')
      .update({
        status:              'approved',
        approved_by_user_id: platformUser.id,
        approved_at:         new Date().toISOString(),
        updated_at:          new Date().toISOString(),
      })
      .eq('id', requestId);

    // DB trigger fires automatically after this update ↑
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, selfApproval: isSelfApproval });
  }

  // ── REJECT ────────────────────────────────────────────────────
  if (action === 'reject') {
    const { rejectionReason } = body;
    if (!['pending_review', 'pending_approval'].includes(req.status))
      return NextResponse.json({ error: 'Cannot reject at this stage.' }, { status: 400 });

    const { error } = await service.from('payment_requests')
      .update({
        status:              'rejected',
        rejected_by_user_id: platformUser.id,
        rejected_at:         new Date().toISOString(),
        rejection_reason:    rejectionReason,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ── MARK PAID — auto-post journal entry ───────────────────────
  if (action === 'mark_paid') {
    if (req.status !== 'approved')
      return NextResponse.json({ error: 'Request must be approved before marking as paid.' }, { status: 400 });

    let journalEntryId: string | null = null;

    // Auto-create journal entry if both accounts are known
    if (expenseAccountId && bankAccountId && fundId && amount) {
      const today = new Date().toISOString().split('T')[0];

      const { data: entry, error: jeError } = await service
        .from('journal_entries')
        .insert({
          organization_id:    orgId,
          entry_date:         req.payment_date ?? today,
          description:        `Payment: ${req.description}`,
          reference_no:       req.request_no,
          entry_type:         'manual',
          period_year:        new Date(req.payment_date ?? today).getFullYear(),
          period_month:       new Date(req.payment_date ?? today).getMonth() + 1,
          created_by_user_id: platformUser.id,
        })
        .select('id').single();

      if (!jeError && entry) {
        await service.from('journal_lines').insert([
          {
            journal_entry_id: entry.id,
            organization_id:  orgId,
            account_id:       expenseAccountId,
            fund_id:          fundId,
            debit_amount:     amount,
            credit_amount:    0,
            description:      req.vendor_name ?? req.description,
          },
          {
            journal_entry_id: entry.id,
            organization_id:  orgId,
            account_id:       bankAccountId,
            fund_id:          fundId,
            debit_amount:     0,
            credit_amount:    amount,
            description:      `Payment — ${req.request_no}`,
          },
        ]);
        journalEntryId = entry.id;
      }
    }

    const { error } = await service.from('payment_requests')
      .update({
        status:           'paid',
        proof_uploaded:   true,
        journal_entry_id: journalEntryId,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, journalEntryId });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
