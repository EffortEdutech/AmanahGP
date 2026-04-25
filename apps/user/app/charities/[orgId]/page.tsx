import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ScoreRing } from '@/components/ui/score-ring';
import { CertifiedBadge, TierBadge } from '@/components/ui/badge';
import { TrustBadge } from '@/components/ui/trust-badge';
import { TrustPillarPanel, TrustSnapshotPanel } from '@/components/ui/trust-panel';
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

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [{ data: profile, error: profileError }, { data: events, error: eventsError }] = await Promise.all([
    supabase
      .from('v_amanahhub_public_profiles')
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
  const trustGrade = showTrustScore ? getTrustGrade(org.amanah_index_score ?? 0) : null;
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const summary = getPublicProfileSummary(org) ?? stageMeta.description;

  const snapshotSignals = buildSnapshotSignals(org);
  const pillarRows = buildPillarRows(org);

  return (
    <div className="bg-white">
      <section className="border-b border-emerald-100 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
            <Link href="/charities" className="font-medium text-emerald-700 hover:text-emerald-800">
              â† Back to directory
            </Link>
            <GovernanceStageBadge stage={org.governance_stage_key} />
            {showTrustScore ? <TierBadge score={org.amanah_index_score ?? 0} /> : null}
            {org.snapshot_status === 'published' && org.review_status === 'approved' ? <CertifiedBadge /> : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-5">
                {showTrustScore ? (
                  <ScoreRing score={org.amanah_index_score ?? 0} size="lg" showLabel />
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                    Amanah
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    Public organisation profile
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    {org.name}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                    {org.org_type ? <span>{org.org_type}</span> : null}
                    {org.state ? <span>â€¢ {org.state}</span> : null}
                    {org.registration_no ? <span>â€¢ Reg. {org.registration_no}</span> : null}
                  </div>
                </div>
              </div>

              <p className="mt-5 max-w-3xl text-[15px] leading-8 text-slate-600">{summary}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <MiniStat
                  label="Governance stage"
                  value={org.governance_stage_label ?? stageMeta.label}
                />
                <MiniStat
                  label="Trust profile"
                  value={org.snapshot_status === 'published' ? 'Published' : 'In progress'}
                />
                <MiniStat
                  label="Review status"
                  value={org.review_status ? formatReviewStatus(org.review_status) : 'Awaiting review'}
                />
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
                {trustGrade ? (
                  <TrustBadge
                    score={org.amanah_index_score ?? 0}
                    grade={trustGrade.grade}
                    gradeLabel={trustGrade.label}
                    gradeSublabel={trustGrade.gradeSublabel}
                    lastUpdated={org.published_at ?? org.public_updated_at ?? org.updated_at}
                    certified={org.snapshot_status === 'published' && org.review_status === 'approved'}
                    size="lg"
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Amanah journey
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">
                      This organisation is building its public trust profile.
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      A full published trust snapshot is not available yet, but donors can still view
                      the organisation and follow its progress on governance visibility.
                    </p>
                  </div>
                )}

                <div className="mt-5 space-y-3">
                  <a
                    href={`/donate/${org.organization_id}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Donate now
                  </a>
                  <a
                    href="#trust-signals"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    View trust signals
                  </a>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm text-sm text-slate-600">
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
          </div>
        </div>
      </section>

      <section id="trust-signals" className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <TrustSnapshotPanel orgName={org.name} signals={snapshotSignals} />
          <TrustPillarPanel pillars={pillarRows} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Public trust timeline</h2>
              <p className="text-sm text-slate-500">
                Public milestones shared from the organisationâ€™s governance journey.
              </p>
            </div>
          </div>

          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500">
              No public timeline items have been published yet. New milestones will appear here as this organisation progresses.
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                      {event.event_type}
                    </span>
                    {event.occurred_at ? <span>{new Date(event.occurred_at).toLocaleDateString()}</span> : null}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    {event.event_title ?? 'Public governance update'}
                  </h3>
                  {event.event_summary ? (
                    <p className="mt-1 text-sm leading-6 text-slate-600">{event.event_summary}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {org.notes_public ? (
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Public notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{org.notes_public}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function buildSnapshotSignals(org: PublicTrustProfile) {
  return [
    {
      label: 'Public organisation profile is available',
      detail: 'Donors can review the organisation profile and contact details publicly.',
      ok: Boolean(org.website_url || org.contact_email || org.contact_phone || org.address),
    },
    {
      label: 'Governance stage is visible',
      detail: 'The organisationâ€™s current governance journey status is shown publicly.',
      ok: Boolean(org.governance_stage_key),
    },
    {
      label: 'Published trust snapshot',
      detail: 'A reviewed public trust snapshot has been published for donor reference.',
      ok: Boolean(org.snapshot_status === 'published'),
    },
    {
      label: 'Amanah Index can be shown',
      detail: 'A donor-facing score is visible when a published trust snapshot exists.',
      ok: canShowTrustScore(org),
    },
    {
      label: 'Oversight or authority information is available',
      detail: 'Relevant supervising body or oversight context is visible publicly.',
      ok: Boolean(org.oversight_authority),
    },
  ];
}

function buildPillarRows(org: PublicTrustProfile) {
  const map: Record<string, string> = {
    financial_integrity: 'Financial integrity',
    governance: 'Governance',
    compliance: 'Compliance',
    transparency: 'Transparency',
    impact: 'Impact',
  };

  const raw = org.amanah_index_breakdown;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return [
      { key: 'signals', publicLabel: 'Visible trust signals', pct: canShowTrustScore(org) ? 80 : 35 },
    ];
  }

  const rows = Object.entries(raw)
    .map(([key, value]) => {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return null;
      return {
        key,
        publicLabel: map[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        pct: Math.max(0, Math.min(100, n)),
      };
    })
    .filter(Boolean) as { key: string; publicLabel: string; pct: number }[];

  return rows.length > 0
    ? rows
    : [{ key: 'signals', publicLabel: 'Visible trust signals', pct: canShowTrustScore(org) ? 80 : 35 }];
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatReviewStatus(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}






