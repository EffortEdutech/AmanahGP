import { createClient } from '@/lib/supabase/server';
import { DirectorySearch } from '@/components/charity/directory-search';
import { CharityCard } from '@/components/charity/charity-card';
import {
  type GovernanceJourneyStage,
  type PublicTrustProfile,
  DIRECTORY_STAGE_META,
  getPublicProfileSummary,
  groupProfilesByStage,
} from '@/lib/public-trust';

const STAGE_ORDER: GovernanceJourneyStage[] = [
  'published_trust_profile',
  'governance_review_in_progress',
  'public_organisation_profile',
  'onboarding_with_agp',
];

export const dynamic = 'force-dynamic';

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; org_type?: string; state?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const q = params.q?.trim();
  const orgType = params.org_type?.trim();
  const state = params.state?.trim();

  const supabase = await createClient();

  let query = supabase
    .from('v_amanahhub_public_trust_profiles')
    .select('*')
    .order('governance_stage_sort', { ascending: true })
    .order('trust_score', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true });

  if (q) query = query.ilike('name', `%${q}%`);
  if (orgType) query = query.eq('org_type', orgType);
  if (state) query = query.eq('state', state);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const profiles = (data ?? []) as PublicTrustProfile[];
  const grouped = groupProfilesByStage(profiles);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white p-6 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">AmanahHub Directory</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Trusted charities and public trust profiles</h1>
          <p className="text-sm leading-7 text-slate-600">
            Browse organisations across their governance journey. Some already have published trust snapshots,
            while others are building their public profile and strengthening governance step by step.
          </p>
          <p className="text-sm font-medium italic text-emerald-800">
            everyone is welcome, and every organisation is on a journey of amanah.
          </p>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Browse organisations</h2>
            <p className="text-xs text-slate-500">Filter by name, type, or state.</p>
          </div>
          <div className="text-xs text-slate-500">{profiles.length} organisation{profiles.length === 1 ? '' : 's'} found</div>
        </div>
        <DirectorySearch defaultQ={q} defaultOrgType={orgType} defaultState={state} />
      </section>

      {profiles.length === 0 ? (
        <section className="card p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No public organisations found yet.</h2>
          <p className="mt-2 text-sm text-slate-500">
            Try adjusting your search filters. New organisations may appear as they continue their amanah journey.
          </p>
        </section>
      ) : (
        <div className="space-y-8">
          {STAGE_ORDER.map((stageKey) => {
            const items = grouped[stageKey] ?? [];
            if (items.length === 0) return null;

            const meta = DIRECTORY_STAGE_META[stageKey];

            return (
              <section key={stageKey} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{meta.label}</h2>
                    <p className="text-sm text-slate-500">{meta.description}</p>
                  </div>
                  <div className="text-xs font-medium text-slate-500">{items.length} organisation{items.length === 1 ? '' : 's'}</div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((profile) => (
                    <CharityCard
                      key={profile.organization_id}
                      org={{
                        id: profile.organization_id,
                        name: profile.name,
                        summary: getPublicProfileSummary(profile),
                        org_type: profile.org_type,
                        state: profile.state,
                        certification_status:
                          profile.snapshot_status === 'published' && profile.review_status === 'approved'
                            ? 'certified'
                            : null,
                        amanah_score: profile.has_published_snapshot ? profile.trust_score : null,
                        governance_stage_key: profile.governance_stage_key,
                        governance_stage_label: profile.governance_stage_label,
                        governance_stage_description: profile.governance_stage_description,
                      }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
