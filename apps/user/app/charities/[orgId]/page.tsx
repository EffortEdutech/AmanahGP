import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrustBadge } from '@/components/charity/trust-badge';
import { TrustPillarPanel } from '@/components/charity/trust-pillar-panel';
import { TrustSnapshotPanel } from '@/components/charity/trust-snapshot-panel';
import { GovernanceStageBadge } from '@/components/charity/governance-stage-badge';
import {
  type PublicTrustEvent,
  type PublicTrustProfile,
  canShowTrustScore,
  getDirectoryStageMeta,
  getPublicProfileSummary,
  hasPublishedTrustSnapshot,
} from '@/lib/public-trust';
import { getTrustGrade } from '@/lib/trust';

export const dynamic = 'force-dynamic';

export default async function CharityDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [{ data: profile, error: profileError }, { data: events, error: eventsError }] = await Promise.all([
    supabase
      .from('v_amanahhub_public_trust_profiles')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle(),
    supabase
      .from('v_amanahhub_public_trust_events')
      .select('*')
      .eq('organization_id', orgId)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(12),
  ]);

  if (profileError) throw new Error(profileError.message);
  if (eventsError) throw new Error(eventsError.message);
  if (!profile) notFound();

  const org = profile as PublicTrustProfile;
  const timeline = (events ?? []) as PublicTrustEvent[];
  const hasPublishedSnapshot = hasPublishedTrustSnapshot(org);
  const showTrustScore = canShowTrustScore(org);
  const trustGrade = showTrustScore ? getTrustGrade(org.trust_score ?? 0) : null;
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const summary = getPublicProfileSummary(org);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/charities" className="font-medium text-emerald-700 hover:text-emerald-800">
          ← Back to directory
        </Link>
        <GovernanceStageBadge stage={org.governance_stage_key} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Public organisation profile</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{org.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {org.org_type ? <span>{org.org_type}</span> : null}
                {org.state ? <span>• {org.state}</span> : null}
                {org.registration_no ? <span>• Reg. {org.registration_no}</span> : null}
              </div>
            </div>

            {summary ? <p className="text-sm leading-7 text-slate-600">{summary}</p> : null}

            <div className="grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Governance stage</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{org.governance_stage_label ?? stageMeta.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{org.governance_stage_description ?? stageMeta.description}</p>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                {org.current_case_code ? (
                  <p>
                    <span className="font-medium text-slate-800">Current case:</span> {org.current_case_code}
                  </p>
                ) : null}
                {org.current_case_status ? (
                  <p>
                    <span className="font-medium text-slate-800">Review status:</span> {org.current_case_status}
                  </p>
                ) : null}
                {org.published_at ? (
                  <p>
                    <span className="font-medium text-slate-800">Published:</span>{' '}
                    {new Date(org.published_at).toLocaleDateString()}
                  </p>
                ) : org.public_updated_at ? (
                  <p>
                    <span className="font-medium text-slate-800">Profile updated:</span>{' '}
                    {new Date(org.public_updated_at).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {showTrustScore && trustGrade ? (
            <div className="card p-6">
              <TrustBadge
                score={org.trust_score ?? 0}
                grade={trustGrade.grade}
                description={trustGrade.description}
                tier={org.trust_tier}
              />
            </div>
          ) : (
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Amanah journey</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">This organisation is welcomed on the platform.</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                A published trust snapshot is not available yet. Donors can still discover the organisation, follow its
                governance journey, and review new public updates as they are published.
              </p>
            </div>
          )}

          <div className="card p-6 text-sm text-slate-600">
            <h2 className="text-base font-semibold text-slate-900">Organisation details</h2>
            <div className="mt-4 space-y-2">
              {org.website_url ? (
                <p>
                  <span className="font-medium text-slate-800">Website:</span>{' '}
                  <a href={org.website_url} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800">
                    {org.website_url}
                  </a>
                </p>
              ) : null}
              {org.contact_email ? (
                <p>
                  <span className="font-medium text-slate-800">Email:</span> {org.contact_email}
                </p>
              ) : null}
              {org.contact_phone ? (
                <p>
                  <span className="font-medium text-slate-800">Phone:</span> {org.contact_phone}
                </p>
              ) : null}
              {org.oversight_authority ? (
                <p>
                  <span className="font-medium text-slate-800">Oversight authority:</span> {org.oversight_authority}
                </p>
              ) : null}
              {org.address ? (
                <p>
                  <span className="font-medium text-slate-800">Address:</span> {org.address}
                </p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>

      {hasPublishedSnapshot ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <TrustSnapshotPanel
            status={org.snapshot_status}
            reviewStatus={org.review_status}
            effectiveFrom={org.effective_from}
            effectiveTo={org.effective_to}
            publishedAt={org.published_at}
            lastReviewedAt={org.last_reviewed_at}
          />
          <TrustPillarPanel pillarScores={org.pillar_scores} />
        </section>
      ) : null}

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Public trust timeline</h2>
            <p className="text-sm text-slate-500">Public milestones shared from the organisation&apos;s governance journey.</p>
          </div>
        </div>

        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">
            No public timeline items have been published yet. New milestones will appear here as this organisation
            progresses through its amanah journey.
          </p>
        ) : (
          <div className="space-y-3">
            {timeline.map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{event.event_type}</span>
                  {event.occurred_at ? <span>{new Date(event.occurred_at).toLocaleDateString()}</span> : null}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">{event.event_title ?? 'Public governance update'}</h3>
                {event.event_summary ? <p className="mt-1 text-sm leading-6 text-slate-600">{event.event_summary}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {org.notes_public ? (
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900">Public notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{org.notes_public}</p>
        </section>
      ) : null}
    </div>
  );
}
