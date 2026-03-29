'use server';
// apps/admin/app/(dashboard)/review/recalculate.ts
// AmanahHub Console — Trigger Amanah Index recalculation (reviewer/super_admin)
// Calls the Edge Function after any reviewer decision that affects trust score

import { createClient }  from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { isReviewerOrAbove, AUDIT_ACTIONS, TRUST_EVENT_TYPES } from '@agp/config';

async function requireReviewer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!data || !isReviewerOrAbove(data.platform_role)) return null;
  return data;
}

/**
 * Call the recalculate-amanah Edge Function.
 * Used internally after reviewer decisions.
 * Also callable manually from reviewer UI.
 */
export async function triggerAmanahRecalc(params: {
  organizationId: string;
  triggerEvent:   string;
  actorUserId?:   string;
}): Promise<{ ok: boolean; scoreValue?: number; error?: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: 'Supabase configuration missing' };
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/functions/v1/recalculate-amanah`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          organization_id: params.organizationId,
          trigger_event:   params.triggerEvent,
          actor_user_id:   params.actorUserId ?? null,
        }),
      }
    );

    const data = await res.json() as {
      ok: boolean; score_value?: number; grade?: string; error?: string;
    };

    return { ok: data.ok, scoreValue: data.score_value, error: data.error };
  } catch (err) {
    console.error('[recalc] Failed to call Edge Function:', err);
    return { ok: false, error: 'Recalculation service unavailable' };
  }
}

/**
 * Manual recalc — callable from reviewer UI.
 * Appends a trust_event(manual_recalc) then triggers recalc.
 */
export async function manualAmanahRecalc(
  _prev: { error?: string; success?: boolean; score?: number } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean; score?: number }> {
  const me = await requireReviewer();
  if (!me) return { error: 'Reviewer role required' };

  const organizationId = formData.get('organizationId') as string;
  if (!organizationId) return { error: 'Organization ID missing' };

  const supabase = await createClient();

  // Append trust event
  const idempotencyKey = `manual_recalc_${organizationId}_${Date.now()}`;
  await supabase.from('trust_events').insert({
    organization_id: organizationId,
    event_type:      TRUST_EVENT_TYPES.MANUAL_RECALC,
    payload:         { triggered_by: me.id },
    actor_user_id:   me.id,
    source:          'reviewer',
    idempotency_key: idempotencyKey,
  });

  await writeAuditLog({
    actorUserId:    me.id,
    actorRole:      me.platform_role,
    organizationId,
    action:         AUDIT_ACTIONS.MANUAL_RECALC,
    entityTable:    'amanah_index_history',
    entityId:       null,
    metadata:       { trigger: 'manual_recalc' },
  });

  const result = await triggerAmanahRecalc({
    organizationId,
    triggerEvent: 'manual_recalc',
    actorUserId:  me.id,
  });

  if (!result.ok) return { error: result.error ?? 'Recalculation failed' };

  return { success: true, score: result.scoreValue };
}
