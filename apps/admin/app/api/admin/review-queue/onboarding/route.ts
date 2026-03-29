// apps/admin/app/api/admin/review-queue/onboarding/route.ts
// AmanahHub Console — Reviewer: Onboarding review queue
// GET /api/admin/review-queue/onboarding

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isReviewerOrAbove } from '@agp/config';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // ── Auth check ───────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (!userRecord || !isReviewerOrAbove(userRecord.platform_role)) {
    return NextResponse.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Reviewer role required' } },
      { status: 403 }
    );
  }

  // ── Fetch submitted orgs pending review ──────────────────────
  const { searchParams } = request.nextUrl;
  const limit  = Math.min(Number(searchParams.get('limit') ?? 20), 100);

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, org_type, state, onboarding_status, onboarding_submitted_at, created_at')
    .eq('onboarding_status', 'submitted')
    .order('onboarding_submitted_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: { items: data ?? [], next_cursor: null } });
}
