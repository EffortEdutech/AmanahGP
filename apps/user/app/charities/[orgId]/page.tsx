import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrustBadge } from '@/components/ui/trust-badge';
import { TrustSnapshotPanel } from '@/components/charity/trust-snapshot-panel';
import { TrustPillarPanel } from '@/components/charity/trust-pillar-panel';
import {
  type PublicTrustEvent,
  type PublicTrustProfile,
  canShowTrustScore,
  getDirectoryStageMeta,
  getPublicProfileSummary,
  hasPublishedTrustSnapshot,
  orgTypeLabel,
} from '@/lib/public-trust';
import { getTrustGrade } from '@/lib/trust';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ orgId: string }>;
};

type SnapshotSignal = {
  label: string;
  detail: string;
  ok: boolean;
};

type PillarData = {
  key: string;
  publicLabel: string;
  pct: number;
};

export default async function CharityProfilePage({ params }: PageProps) {
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
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const hasPublishedSnapshot = hasPublishedTrustSnapshot(org);
  const hasScore = canShowTrustScore(org);
  const score = Number(org.amanah_index_score ?? 0);
  const trustGrade = hasScore ? getTrustGrade(score) : null;
  const summary = getPublicProfileSummary(org) ?? stageMeta.description;
  const isCertified = org.snapshot_status === 'published' && org.review_status === 'approved';
  const snapshotSignals = toSnapshotSignals(org.signals_public, org);
  const pillarBreakdown = toPillars(org.amanah_index_breakdown);

  return (
    <div className="bg-white">
      <section className="border-b border-emerald-100 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_35%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
          <Link href="/charities" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
            <span aria-hidden="true">&larr;</span> Back to directory
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                <span>{orgTypeLabel(org.org_type) ?? 'Organisation'}</span>
                {org.state ? (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>{org.state}</span>
                  </>
                ) : null}
                {org.registration_no ? (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>Reg. {org.registration_no}</span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight text-gray-950 sm:text-5xl">
                {org.name}
              </h1>

              <p className="mt-5 max-w-3xl text-[15px] leading-8 text-gray-600">
                {summary}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${stageMeta.accentClass}`}>
                  {org.governance_stage_label ?? stageMeta.label}
                </span>
                {isCertified ? (
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">
                    Certified
                  </span>
                ) : null}
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                  {org.snapshot_status === 'published' ? 'Published public profile' : 'Building public profile'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {trustGrade ? (
                <TrustBadge
                  score={score}
                  grade={trustGrade.grade}
                  gradeLabel={trustGrade.label}
                  gradeSublabel={trustGrade.gradeSublabel}
                  lastUpdated={org.published_at ?? org.public_updated_at}
                  certified={isCertified}
                  size="lg"
                />
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">Amanah Index in progress</p>
                  <p className="mt-2 text-sm leading-7 text-gray-500">
                    This organisation is visible while its full public trust profile is still being built or reviewed.
                  </p>
                </div>
              )}
              <Link
                href={`/donate/${org.organization_id}`}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Donate to this organisation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <Panel title="Why donors may consider this organisation">
            <p className="text-[14px] leading-8 text-slate-600">{summary}</p>
            {org.notes_public ? (
              <p className="mt-4 whitespace-pre-wrap text-[14px] leading-8 text-slate-600">{org.notes_public}</p>
            ) : null}
          </Panel>

          {hasPublishedSnapshot ? (
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <TrustSnapshotPanel signals={snapshotSignals} orgName={org.name} />
              <TrustPillarPanel pillars={pillarBreakdown} />
            </section>
          ) : (
            <Panel title="Trust snapshot in progress">
              <p className="text-sm leading-7 text-slate-600">
                A full trust snapshot is not published yet. Donors can still view the organisation profile and follow public governance updates as they are released.
              </p>
            </Panel>
          )}

          <Panel title="Public trust timeline">
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-500">
                No public timeline items have been published yet. New milestones will appear here as this organisation progresses through its amanah journey.
              </p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                          {formatEventType(event.event_type)}
                        </span>
                        {event.event_category ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            {formatEventType(event.event_category)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs font-medium text-slate-400">
                        {formatDate(event.occurred_at ?? event.published_at)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {event.event_title ?? 'Public governance update'}
                    </p>
                    {event.event_summary ? (
                      <p className="mt-2 text-sm leading-7 text-slate-600">{event.event_summary}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Organisation details">
            <dl className="space-y-4 text-sm">
              <Detail label="Type" value={orgTypeLabel(org.org_type) ?? org.org_type ?? 'Not specified'} />
              <Detail label="State" value={org.state ?? 'Not specified'} />
              <Detail label="City" value={org.city ?? 'Not specified'} />
              <Detail label="Registration" value={org.registration_no ?? 'Not disclosed'} />
              <Detail label="Oversight" value={org.oversight_authority ?? 'Not disclosed'} />
              <Detail label="Website" value={org.website_url ?? 'Not disclosed'} isLink />
              <Detail label="Email" value={org.contact_email ?? 'Not disclosed'} />
              <Detail label="Phone" value={org.contact_phone ?? 'Not disclosed'} />
            </dl>
          </Panel>

          <Panel title="Governance journey">
            <p className="text-sm font-semibold text-slate-900">{org.governance_stage_label ?? stageMeta.label}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {org.governance_stage_description ?? stageMeta.description}
            </p>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              {org.current_case_code ? <p><span className="font-semibold text-slate-700">Current case:</span> {org.current_case_code}</p> : null}
              {org.current_case_status ? <p><span className="font-semibold text-slate-700">Review status:</span> {formatEventType(org.current_case_status)}</p> : null}
              {org.published_at ? <p><span className="font-semibold text-slate-700">Published:</span> {formatDate(org.published_at)}</p> : null}
              {org.public_updated_at ? <p><span className="font-semibold text-slate-700">Updated:</span> {formatDate(org.public_updated_at)}</p> : null}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Detail({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-slate-700">
        {isLink && value.startsWith('http') ? (
          <a href={value} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:text-emerald-800">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Date not published';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatEventType(type: string | null | undefined) {
  if (!type) return 'Update';
  return type
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toSnapshotSignals(value: unknown, org: PublicTrustProfile): SnapshotSignal[] {
  const fallback: SnapshotSignal[] = [
    {
      label: 'Published public profile',
      detail: org.snapshot_status === 'published'
        ? 'A donor-facing trust profile has been published.'
        : 'The public trust profile is being prepared.',
      ok: org.snapshot_status === 'published',
    },
    {
      label: 'Certification review approved',
      detail: org.review_status === 'approved'
        ? 'The latest trust review status is approved.'
        : 'The latest trust review is not yet approved.',
      ok: org.review_status === 'approved',
    },
    {
      label: 'Amanah Index available',
      detail: typeof org.amanah_index_score === 'number'
        ? `Current Amanah Index is ${org.amanah_index_score.toFixed(1)}/100.`
        : 'Amanah Index is not yet available.',
      ok: typeof org.amanah_index_score === 'number' && org.amanah_index_score > 0,
    },
    {
      label: 'Governance journey visible',
      detail: org.governance_stage_label ?? 'Governance stage is published for donors.',
      ok: Boolean(org.governance_stage_key),
    },
    {
      label: 'Organisation identity available',
      detail: org.registration_no ? `Registration number published: ${org.registration_no}.` : 'Registration number is not disclosed.',
      ok: Boolean(org.registration_no),
    },
  ];

  if (!value || typeof value !== 'object') return fallback;

  const fromArray = Array.isArray(value) ? value : null;
  if (fromArray) {
    const signals = fromArray
      .map((item) => normalizeSignal(item))
      .filter((item): item is SnapshotSignal => Boolean(item));
    return signals.length > 0 ? signals : fallback;
  }

  const objectSignals = Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => normalizeSignal(item, key))
    .filter((item): item is SnapshotSignal => Boolean(item));

  return objectSignals.length > 0 ? objectSignals : fallback;
}

function normalizeSignal(item: unknown, fallbackKey?: string): SnapshotSignal | null {
  if (!item || typeof item !== 'object') {
    if (!fallbackKey) return null;
    return {
      label: formatEventType(fallbackKey),
      detail: 'Public signal available.',
      ok: Boolean(item),
    };
  }

  const row = item as Record<string, unknown>;
  return {
    label: stringValue(row.label ?? row.title ?? row.name ?? fallbackKey, 'Public trust signal'),
    detail: stringValue(row.detail ?? row.description ?? row.summary, 'Signal derived from available public trust data.'),
    ok: booleanValue(row.ok ?? row.passed ?? row.status ?? row.value),
  };
}

function toPillars(value: unknown): PillarData[] {
  const fallback: PillarData[] = [
    { key: 'financial_integrity', publicLabel: 'Financial Integrity', pct: 0 },
    { key: 'governance', publicLabel: 'Governance', pct: 0 },
    { key: 'compliance', publicLabel: 'Compliance', pct: 0 },
    { key: 'transparency', publicLabel: 'Transparency', pct: 0 },
    { key: 'impact', publicLabel: 'Impact', pct: 0 },
  ];

  if (!value || typeof value !== 'object') return fallback;

  if (Array.isArray(value)) {
    const pillars = value
      .map((item) => normalizePillar(item))
      .filter((item): item is PillarData => Boolean(item));
    return pillars.length > 0 ? pillars : fallback;
  }

  const pillars = Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => normalizePillar(item, key))
    .filter((item): item is PillarData => Boolean(item));

  return pillars.length > 0 ? pillars : fallback;
}

function normalizePillar(item: unknown, fallbackKey?: string): PillarData | null {
  if (typeof item === 'number') {
    return {
      key: fallbackKey ?? 'pillar',
      publicLabel: formatEventType(fallbackKey ?? 'pillar'),
      pct: clampPercent(item),
    };
  }

  if (!item || typeof item !== 'object') return null;

  const row = item as Record<string, unknown>;
  const key = stringValue(row.key ?? row.code ?? fallbackKey, 'pillar');
  return {
    key,
    publicLabel: stringValue(row.publicLabel ?? row.public_label ?? row.label ?? row.name, formatEventType(key)),
    pct: clampPercent(numberValue(row.pct ?? row.percent ?? row.percentage ?? row.score ?? row.value)),
  };
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function booleanValue(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === 'passed' || normalized === 'ok' || normalized === 'approved' || normalized === 'published';
  }
  return Boolean(value);
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}
