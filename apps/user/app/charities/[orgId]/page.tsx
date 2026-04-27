import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrustBadge } from '@/components/ui/trust-badge';
import {
  type PublicTrustEvent,
  type PublicTrustProfile,
  canShowTrustScore,
  getDirectoryStageMeta,
  getPublicProfileSummary,
  orgTypeLabel,
} from '@/lib/public-trust';
import { getTrustGrade } from '@/lib/trust';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function CharityProfilePage({ params }: PageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('v_amanahhub_public_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!profile) notFound();

  const org = profile as PublicTrustProfile;
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const hasScore = canShowTrustScore(org);
  const score = Number(org.amanah_index_score ?? 0);
  const trustGrade = hasScore ? getTrustGrade(score) : null;
  const summary = getPublicProfileSummary(org) ?? stageMeta.description;
  const isCertified = org.snapshot_status === 'published' && org.review_status === 'approved';

  const { data: events } = await supabase
    .from('v_public_trust_timeline')
    .select('*')
    .eq('organization_id', org.organization_id)
    .order('occurred_at', { ascending: false, nullsFirst: false })
    .limit(8);

  const timeline = (events ?? []) as PublicTrustEvent[];

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
              <p className="mt-4 text-[14px] leading-8 text-slate-600">{org.notes_public}</p>
            ) : null}
          </Panel>

          <Panel title="Public trust timeline">
            {timeline.length === 0 ? (
              <p className="text-sm text-slate-500">No public trust events have been published yet.</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {event.event_title ?? formatEventType(event.event_type)}
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        {formatDate(event.occurred_at ?? event.published_at)}
                      </p>
                    </div>
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
            </dl>
          </Panel>

          <Panel title="Governance journey">
            <p className="text-sm font-semibold text-slate-900">{org.governance_stage_label ?? stageMeta.label}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {org.governance_stage_description ?? stageMeta.description}
            </p>
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
      <dd className="mt-1 text-slate-700">
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

function formatEventType(type: string) {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
