// apps/user/app/charities/page.tsx
// AmanahHub — Public charity directory

import { createClient }    from '@/lib/supabase/server';
import { CharityCard }     from '@/components/charity/charity-card';
import { DirectorySearch } from '@/components/charity/directory-search';

export const metadata = {
  title: 'Charity Directory',
  description: 'Browse verified Islamic charities in Malaysia.',
};

interface Props {
  searchParams: Promise<{
    q?: string;
    org_type?: string;
    state?: string;
  }>;
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

  // Shape — pick latest cert and score
  const items = (orgs ?? []).map((org) => {
    const certs  = (org.certification_history ?? []) as any[];
    const scores = (org.amanah_index_history ?? []) as any[];

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Trusted Giving. Transparent Governance.
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm">
          Every organization here has been reviewed and verified on the Amanah Governance Platform.
          Give with confidence.
        </p>
      </div>

      {/* Search + filters */}
      <DirectorySearch
        defaultQ={params.q}
        defaultOrgType={params.org_type}
        defaultState={params.state}
      />

      {/* Results */}
      <div className="mt-6">
        {items.length > 0 ? (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {items.length} organization{items.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((org) => (
                <CharityCard key={org.id} org={org} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              No organizations found.
              {params.q || params.org_type || params.state
                ? ' Try adjusting your filters.'
                : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
