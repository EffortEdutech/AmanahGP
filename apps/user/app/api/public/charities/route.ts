// apps/user/app/api/public/charities/route.ts
// AmanahHub — Public charity directory API
// GET /api/public/charities?q=&org_type=&state=&limit=20&cursor=

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q        = searchParams.get('q') ?? '';
  const orgType  = searchParams.get('org_type') ?? '';
  const state    = searchParams.get('state') ?? '';
  const limit    = Math.min(Number(searchParams.get('limit') ?? 20), 100);

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

  if (q)       query = query.ilike('name', `%${q}%`);
  if (orgType) query = query.eq('org_type', orgType);
  if (state)   query = query.eq('state', state);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, data: null, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  // Shape public response — never leak private fields
  const items = (data ?? []).map((org) => {
    const latestCert = org.certification_history
      ?.sort((a, b) => new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime())[0];
    const latestScore = org.amanah_index_history
      ?.sort((a, b) => new Date(b.computed_at).getTime() - new Date(a.computed_at).getTime())[0];

    return {
      id:                   org.id,
      name:                 org.name,
      summary:              org.summary,
      org_type:             org.org_type,
      state:                org.state,
      certification_status: latestCert?.new_status ?? null,
      amanah_score:         latestScore?.score_value ?? null,
      updated_at:           org.updated_at,
    };
  });

  return NextResponse.json({ ok: true, data: { items, next_cursor: null } });
}
