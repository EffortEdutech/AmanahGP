// apps/user/app/page.tsx
// AmanahHub â€” Premium Islamic Charity Marketplace Landing (Sprint 25)
// Donor-first storytelling + stronger trust cues + premium visual hierarchy

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ScoreRing } from '@/components/ui/score-ring';
import { CertifiedBadge, TierBadge } from '@/components/ui/badge';
import { GovernanceStageBadge } from '@/components/charity/governance-stage-badge';
import {
  getPublicProfileSummary,
  groupProfilesByStage,
  type PublicTrustProfile,
  type GovernanceJourneyStage,
  DIRECTORY_STAGE_META,
} from '@/lib/public-trust';

const FEATURED_STAGE_ORDER: GovernanceJourneyStage[] = [
  'published_trust_profile',
  'governance_review_in_progress',
  'public_organisation_profile',
];

export const metadata = {
  title: 'AmanahHub â€” Trusted Giving. Transparent Governance.',
};

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: profiles }, { count: orgCount }, { count: donationCount }] = await Promise.all([
    supabase
      .from('v_amanahhub_public_trust_profiles_live_score')
      .select('*')
      .order('governance_stage_sort', { ascending: true })
      .order('trust_score', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(9),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('listing_status', 'listed'),
    supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'paid'),
  ]);

  const publicProfiles = (profiles ?? []) as PublicTrustProfile[];
  const grouped = groupProfilesByStage(publicProfiles);

  return (
    <div className="bg-white text-gray-900">
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_35%),linear-gradient(to_bottom,_#ffffff,_#f8fafc)]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] [background-image:radial-gradient(circle,_#047857_1px,_transparent_1px)] [background-size:24px_24px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          {/* Left */}
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-medium text-emerald-800 shadow-sm backdrop-blur">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Trusted Islamic Giving Marketplace
            </div>

            <h1 className="font-display text-4xl leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Give with <span className="text-emerald-700">clarity</span>, not uncertainty.
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-8 text-gray-600 sm:text-[16px]">
              AmanahHub helps donors discover Islamic charities with visible governance signals,
              independent trust verification, and real operational transparency â€” so your sadaqah
              reaches organisations you can support with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/charities"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Browse trusted charities
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                How AmanahHub works
              </Link>
            </div>

            {/* Trust points */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ['Non-custodial', 'Donations go directly to the charityâ€™s own gateway'],
                ['Visible trust signals', 'Donors see governance and reporting signals publicly'],
                ['Inclusive growth', 'Organisations are welcomed while improving step by step'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-[12px] font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-[11px] leading-6 text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right trust showcase */}
          <div className="lg:pl-4">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_25px_80px_-35px_rgba(16,185,129,0.35)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Donor confidence
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900">What donors can verify</h2>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                  Live public profile
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Governance signals', 'Policies, structure, and accountability activities visible'],
                  ['Financial stewardship', 'Operational records support trust scoring and reviews'],
                  ['Reporting discipline', 'Progress and periodic updates show continuity'],
                  ['Certification journey', 'Organisations can progress toward stronger trust status'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-[12px] font-semibold text-gray-900">{title}</p>
                    <p className="mt-1 text-[11px] leading-6 text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-[12px] font-semibold text-emerald-800">
                  â€œTrust is not a slogan â€” it should be visible before a donor gives.â€
                </p>
                <p className="mt-2 text-[11px] leading-6 text-emerald-700/90">
                  AmanahHub is designed so donors do not have to guess whether an organisation is
                  serious about governance, transparency, and stewardship.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3">
          <StatCard value={String(orgCount ?? 0)} label="Listed organisations" />
          <StatCard value={String(donationCount ?? 0)} label="Recorded completed donations" />
          <StatCard value="100%" label="Non-custodial donation flow" />
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ WHY AMANAHHUB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Why AmanahHub
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-gray-950 sm:text-4xl">
            A donor experience built around trust before transaction.
          </h2>
          <p className="mt-4 text-[15px] leading-8 text-gray-600">
            Most charity directories only show a name and a donation button. AmanahHub adds the missing layer:
            a public trust profile, governance journey visibility, and clearer signals that help donors decide with
            ihsan and prudence.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <FeatureCard
            title="See trust signals instantly"
            desc="Donors can view badges, governance stage, trust score, and supporting public transparency signals."
          />
          <FeatureCard
            title="Support organisations on a journey"
            desc="Not every charity starts perfect. AmanahHub welcomes growth while showing where each organisation stands."
          />
          <FeatureCard
            title="Give directly, safely"
            desc="AmanahHub is non-custodial. Donations are routed through the charityâ€™s own registered payment flow."
          />
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ FEATURED CHARITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="border-y border-gray-100 bg-gray-50/70">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Public charity directory
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
                Explore organisations by trust and governance journey
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-gray-600">
                Organisations appear across different stages â€” from published trust profiles to those still
                progressing in governance and public readiness.
              </p>
            </div>

            <Link
              href="/charities"
              className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View full directory â†’
            </Link>
          </div>

          {publicProfiles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
              No public profiles yet. Once organisations publish their trust profile, they will appear here.
            </div>
          ) : (
            <div className="space-y-10">
              {FEATURED_STAGE_ORDER.map((stageKey) => {
                const items = grouped[stageKey] ?? [];
                if (items.length === 0) return null;
                const meta = DIRECTORY_STAGE_META[stageKey];

                return (
                  <div key={stageKey} className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{meta.label}</h3>
                        <p className="text-sm text-gray-500">{meta.description}</p>
                      </div>
                      <p className="text-xs font-medium text-gray-400">
                        {items.length} organisation{items.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {items.slice(0, 3).map((org) => {
                        const isPublished = org.snapshot_status === 'published' && org.review_status === 'approved';
                        const hasScore = !!org.has_published_snapshot && (org.trust_score ?? 0) > 0;
                        const summary = getPublicProfileSummary(org);

                        return (
                          <Link
                            key={org.organization_id}
                            href={`/charities/${org.organization_id}`}
                            className="group rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                          >
                            <div className="flex items-start gap-4">
                              {hasScore ? (
                                <ScoreRing score={org.trust_score} size="lg" showLabel />
                              ) : (
                                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                  Amanah
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap gap-1.5">
                                  <GovernanceStageBadge stage={org.governance_stage_key} />
                                  {isPublished ? <CertifiedBadge /> : null}
                                  {hasScore ? <TierBadge score={org.trust_score ?? 0} /> : null}
                                </div>

                                <h3 className="mt-3 text-[17px] font-semibold leading-snug text-gray-900 transition group-hover:text-emerald-800">
                                  {org.name}
                                </h3>

                                <p className="mt-1 text-[12px] text-gray-500">
                                  {[org.org_type, org.state].filter(Boolean).join(' Â· ') || 'Organisation'}
                                </p>

                                <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-gray-600">
                                  {summary || meta.description}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                              <span className="text-[11px] font-medium text-gray-500">
                                {org.governance_stage_label ?? meta.label}
                              </span>
                              <span className="text-[12px] font-semibold text-emerald-700">View profile â†’</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DONOR EXPLANATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              How trust is communicated
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
              We help donors answer three questions before they donate.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <QuestionCard
              q="Is this organisation real and accountable?"
              a="Public profiles and governance stages show whether the organisation has established visible operational trust signals."
            />
            <QuestionCard
              q="Do they manage funds responsibly?"
              a="Trust scoring and oversight indicators help donors assess financial discipline and organisational seriousness."
            />
            <QuestionCard
              q="Can I give without uncertainty?"
              a="AmanahHub keeps donations non-custodial and connects donors directly to the charityâ€™s own payment route."
            />
          </div>
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="overflow-hidden rounded-[32px] border border-emerald-200 bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 px-6 py-10 text-white shadow-[0_30px_90px_-35px_rgba(4,120,87,0.7)] sm:px-8 lg:px-12 lg:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
                Begin with confidence
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                Browse public trust profiles and support organisations with greater peace of mind.
              </h2>
              <p className="mt-4 text-[15px] leading-8 text-emerald-50/90">
                Give your sadaqah where governance, transparency, and public trust are not hidden behind guesswork.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/charities"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
              >
                Browse charities
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-800/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800/35"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SMALL COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-2xl font-semibold text-gray-950 sm:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        âœ¦
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-[14px] leading-7 text-gray-600">{desc}</p>
    </div>
  );
}

function QuestionCard({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-[13px] font-semibold leading-6 text-gray-900">{q}</p>
      <p className="mt-2 text-[13px] leading-7 text-gray-600">{a}</p>
    </div>
  );
}



