// apps/user/app/api/public/charities/route.ts
// AmanahHub — Public charity directory API
// GET /api/public/charities?q=&org_type=&state=&limit=20&cursor=

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type CertificationHistoryRow = {
  new_status: string | null;
  valid_from: string | null;
  valid_to: string | null;
  decided_at: string | null;
};

type AmanahIndexHistoryRow = {
  score_value: number | null;
  computed_at: string | null;
};

type OrganizationRow = {
  id: string;
  name: string;
  summary: string | null;
  org_type: string | null;
  state: string | null;
  updated_at: string | null;
  certification_history?: CertificationHistoryRow[] | null;
  amanah_index_history?: AmanahIndexHistoryRow[] | null;
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
      ),
      amanah_index_history (
        score_value,
        computed_at
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

  const items = rows.map((org) => {
    const latestCert = [...(org.certification_history ?? [])].sort(
      (a: CertificationHistoryRow, b: CertificationHistoryRow) =>
        new Date(b.decided_at ?? 0).getTime() -
        new Date(a.decided_at ?? 0).getTime()
    )[0];

    const latestScore = [...(org.amanah_index_history ?? [])].sort(
      (a: AmanahIndexHistoryRow, b: AmanahIndexHistoryRow) =>
        new Date(b.computed_at ?? 0).getTime() -
        new Date(a.computed_at ?? 0).getTime()
    )[0];

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