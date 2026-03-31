// apps/user/app/charities/page.tsx
// AmanahHub — Public charity directory (Sprint 7 UI uplift)
// Data fetching unchanged — visual layer replaced to match UAT s-dir

import { createClient }    from '@/lib/supabase/server';
import { CharityCard }     from '@/components/charity/charity-card';
import { DirectorySearch } from '@/components/charity/directory-search';

export const metadata = {
  title: 'Charity Directory | AmanahHub',
  description: 'Browse verified Islamic charities in Malaysia. Trusted giving, transparent governance.',
};

interface Props {
  searchParams: Promise<{ q?: string; org_type?: string; state?: string }>;
}

export default async function CharitiesPage({ searchParams }: Props) {
  const params   = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('organizations')
    .select(`
      id, name, summary, org_type, state, updated_at,
      certification_history ( new_status, valid_from, valid_to, decided_at ),
      amanah_index_history  ( score_value, computed_at )
    `)
    .eq('listing_status', 'listed')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (params.q)        query = query.ilike('name', `%${params.q}%`);
  if (params.org_type) query = query.eq('org_type', params.org_type);
  if (params.state)    query = query.eq('state', params.state);

  const { data: orgs } = await query;

  const items = (orgs ?? []).map((org) => {
    const certs  = (org.certification_history ?? []) as any[];
    const scores = (org.amanah_index_history  ?? []) as any[];

    const latestCert  = certs.sort((a, b) =>
      new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime())[0];
    const latestScore = scores.sort((a, b) =>
      new Date(b.computed_at).getTime() - new Date(a.computed_at).getTime())[0];

    return {
      id:                   org.id,
      name:                 org.name,
      summary:              org.summary,
      org_type:             org.org_type,
      state:                org.state,
      certification_status: latestCert?.new_status ?? null,
      amanah_score:         latestScore ? Number(latestScore.score_value) : null,
    };
  });

  const hasFilters = !!(params.q || params.org_type || params.state);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-gray-900">Charity Directory</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Trusted Giving. Transparent Governance.
          {items.length > 0 && ` — ${items.length} verified organization${items.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search + filters */}
      <div className="mb-5">
        <DirectorySearch
          defaultQ={params.q}
          defaultOrgType={params.org_type}
          defaultState={params.state}
        />
      </div>

      {/* Results */}
      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((org) => (
            <CharityCard key={org.id} org={org} />
          ))}

          {/* Pending slot */}
          <div className="card p-4 flex flex-col items-center justify-center min-h-[96px] bg-gray-50">
            <p className="text-[11px] text-gray-400 text-center">
              More organizations under review
            </p>
            <p className="text-[10px] text-gray-300 mt-1">
              Applications are verified before listing
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-sm text-gray-400">
            {hasFilters
              ? 'No organizations matched your filters. Try adjusting your search.'
              : 'No listed organizations yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
