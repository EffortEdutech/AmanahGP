import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DirectorySearch } from '@/components/charity/directory-search';
import { CharityCard } from '@/components/charity/charity-card';
import {
  type GovernanceJourneyStage,
  type PublicTrustProfile,
  DIRECTORY_STAGE_META,
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
    .from('v_amanahhub_public_profiles')
    .select('*')
    .order('governance_stage_sort', { ascending: true })
    .order('amanah_index_score', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true });

  if (q) query = query.ilike('name', `%${q}%`);
  if (orgType) query = query.eq('org_type', orgType);
  if (state) query = query.eq('state', state);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const profiles = (data ?? []) as PublicTrustProfile[];
  const grouped = groupProfilesByStage(profiles);

  return (
    <div className="bg-white">
      <section className="border-b border-emerald-100 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_35%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-800 shadow-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              AmanahHub Charity Directory
            </div>
            <h1 className="font-display text-3xl leading-tight tracking-tight text-gray-950 sm:text-5xl">
              Browse charities with clearer trust signals before you donate.
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-gray-600">
              This is the main donor gateway. Compare organisations by governance journey,
              public trust profile, and visible accountability signals â€” not just by name alone.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatCard value={String(profiles.length)} label="Visible organisations" />
            <StatCard value={String(grouped.published_trust_profile?.length ?? 0)} label="Published trust profiles" />
            <StatCard value="Non-custodial" label="Donation model" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Find an organisation</h2>
              <p className="text-sm text-slate-500">
                Search by name, organisation type, or state in Malaysia.
              </p>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {profiles.length} organisation{profiles.length === 1 ? '' : 's'} found
            </p>
          </div>
          <DirectorySearch defaultQ={q} defaultOrgType={orgType} defaultState={state} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14">
        {profiles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">No organisations matched your search.</h2>
            <p className="mt-2 text-sm text-gray-500">Try clearing one or more filters.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {STAGE_ORDER.map((stageKey) => {
              const items = grouped[stageKey] ?? [];
              if (items.length === 0) return null;

              const meta = DIRECTORY_STAGE_META[stageKey];

              return (
                <section key={stageKey} className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{meta.label}</h2>
                      <p className="max-w-3xl text-sm leading-7 text-slate-600">{meta.description}</p>
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                      {items.length} organisation{items.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((profile) => (
                      <CharityCard key={profile.organization_id} org={profile} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="rounded-[28px] border border-emerald-200 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 px-6 py-8 text-white shadow-[0_25px_80px_-35px_rgba(4,120,87,0.8)] sm:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                  Give with greater peace of mind
                </p>
                <h2 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">
                  Trust should be visible before the donor clicks donate.
                </h2>
                <p className="mt-3 text-sm leading-7 text-emerald-50/90">
                  Every organisation is welcomed on a journey of amanah, while donors can still see who has
                  stronger public trust signals today.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                >
                  How it works
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-200/40 bg-emerald-800/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800/35"
                >
                  Back home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-2xl font-semibold text-gray-950">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}





