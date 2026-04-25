import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScoreRing } from '@/components/ui/score-ring';
import { CertifiedBadge, TierBadge } from '@/components/ui/badge';
import { GovernanceStageBadge } from '@/components/charity/governance-stage-badge';
import {
  type PublicTrustProfile,
  getDirectoryStageMeta,
  getPublicProfileSummary,
  orgTypeLabel,
} from '@/lib/public-trust';
import { formatAmanahScoreWithMax } from '@agp/scoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Donate — AmanahHub',
};

type PageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function DonatePage({ params }: PageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('v_amanahhub_public_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    notFound();
  }

  const org = profile as PublicTrustProfile;
  const score = Number(org.amanah_index_score ?? 0);
  const hasScore = Number.isFinite(score) && score > 0;
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const summary = getPublicProfileSummary(org) ?? stageMeta.description;
  const isCertified = org.snapshot_status === 'published' && org.review_status === 'approved';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/charities" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          ← Back to charities
        </Link>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-emerald-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-emerald-50 via-white to-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <GovernanceStageBadge stage={org.governance_stage_key} />
                {isCertified ? <CertifiedBadge /> : null}
                {hasScore ? <TierBadge score={score} /> : null}
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                {org.name}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {orgTypeLabel(org.org_type) ?? 'Organisation'}
                {org.state ? ` · ${org.state}` : ''}
              </p>

              {summary && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-gray-600">
                  {summary}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              {hasScore ? (
                <ScoreRing score={score} size="lg" showLabel />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  Amanah
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-gray-100 p-6 sm:grid-cols-3 sm:p-8">
          <InfoCard label="Amanah Index" value={hasScore ? formatAmanahScoreWithMax(score) : 'In progress'} />
          <InfoCard label="Public profile" value={org.snapshot_status === 'published' ? 'Published' : 'Building'} />
          <InfoCard label="Governance stage" value={org.governance_stage_label ?? stageMeta.label} />
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">Donation flow placeholder</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            This page is restored as an AmanahHub donor-facing route. Connect the donation form/payment flow here.
            The Amanah Index is now read from the live public trust profile view, not from the old hardcoded snapshot tier.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            Payment form integration can be added here after the score-display repair is stable.
          </div>
        </div>

        <aside className="rounded-[28px] border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Why donors may consider this organisation</h2>
          <p className="mt-4 text-sm leading-7 text-gray-700">{summary}</p>
          {org.published_at && (
            <p className="mt-5 text-xs text-gray-500">
              Published trust profile: {new Date(org.published_at).toLocaleDateString('en-MY', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}


