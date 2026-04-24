// apps/user/app/api/public/charities/route.ts
// AmanahHub — Public charity directory API
// GET /api/public/charities?q=&org_type=&state=&limit=20&cursor=

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type CertificationHistoryRow = {
  new_status: string | null;
  valid_from: string | null;
  valid_to: string | null;
  decided_at: string | null;
};

type AmanahIndexHistoryRow = {
  organization_id: string;
  score_value: number | null;
  score_version: string | null;
  computed_at: string | null;
  breakdown?: Record<string, unknown> | null;
};

type OrganizationRow = {
  id: string;
  name: string;
  summary: string | null;
  org_type: string | null;
  state: string | null;
  updated_at: string | null;
  certification_history?: CertificationHistoryRow[] | null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const q = searchParams.get('q') ?? '';
  const orgType = searchParams.get('org_type') ?? '';
  const state = searchParams.get('state') ?? '';
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100);

  const supabase = await createClient();

  let query = supabase
    .from('organizations')
    .select(`
      id,
      name,
      summary,
      org_type,
      state,
      updated_at,
      certification_history (
        new_status,
        valid_from,
        valid_to,
        decided_at
      )
    `)
    .eq('listing_status', 'listed')
    .limit(limit)
    .order('updated_at', { ascending: false });

  if (q) query = query.ilike('name', `%${q}%`);
  if (orgType) query = query.eq('org_type', orgType);
  if (state) query = query.eq('state', state);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        data: null,
        error: {
          code: 'QUERY_ERROR',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as OrganizationRow[];
  const orgIds = rows.map((org) => org.id);

  const { data: scoreRows, error: scoreError } = orgIds.length
    ? await supabase
        .from('amanah_index_history')
        .select('organization_id, score_value, score_version, computed_at, breakdown')
        .in('organization_id', orgIds)
        .eq('score_version', 'amanah_v2_events')
        .eq('breakdown->>model', 'baseline_plus_events_v1')
        .order('computed_at', { ascending: false })
    : { data: [], error: null };

  if (scoreError) {
    return NextResponse.json(
      {
        ok: false,
        data: null,
        error: {
          code: 'SCORE_QUERY_ERROR',
          message: scoreError.message,
        },
      },
      { status: 500 }
    );
  }

  const latestScoreByOrg = new Map<string, AmanahIndexHistoryRow>();

  for (const row of (scoreRows ?? []) as AmanahIndexHistoryRow[]) {
    if (!latestScoreByOrg.has(row.organization_id)) {
      latestScoreByOrg.set(row.organization_id, row);
    }
  }

  const items = rows.map((org) => {
    const latestCert = [...(org.certification_history ?? [])].sort(
      (a: CertificationHistoryRow, b: CertificationHistoryRow) =>
        new Date(b.decided_at ?? 0).getTime() -
        new Date(a.decided_at ?? 0).getTime()
    )[0];

    const latestScore = latestScoreByOrg.get(org.id) ?? null;

    return {
      id: org.id,
      name: org.name,
      summary: org.summary,
      org_type: org.org_type,
      state: org.state,
      certification_status: latestCert?.new_status ?? null,
      amanah_score: latestScore?.score_value ?? null,
      updated_at: org.updated_at,
    };
  });

  return NextResponse.json({
    ok: true,
    data: {
      items,
      next_cursor: null,
    },
  });
}