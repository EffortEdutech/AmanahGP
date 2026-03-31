// apps/user/app/page.tsx
// AmanahHub — Home landing page (Sprint 10)
// Full donor-facing landing with hero, platform stats, featured orgs,
// how it works, Islamic governance section, donor CTA

import Link             from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ScoreRing, scoreTier, tierLabel } from '@/components/ui/score-ring';

export const metadata = {
  title: 'AmanahHub — Trusted Giving. Transparent Governance.',
  description:
    'Discover verified Malaysian Islamic charities. Every organization is independently evaluated for transparency, governance, and impact before your donation reaches them.',
};

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo: 'NGO', mosque_surau: 'Mosque / Surau', waqf_institution: 'Waqf Institution',
  zakat_body: 'Zakat Body', foundation: 'Foundation', other: 'Other',
};

export default async function HomePage() {
  const supabase = await createClient();

  // Platform stats
  const [{ count: orgCount }, { count: reportCount }, { count: donationCount }] =
    await Promise.all([
      supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('listing_status', 'listed'),
      supabase.from('project_reports').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      supabase.from('donation_transactions').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    ]);

  // Total confirmed donation amount
  const { data: donationSum } = await supabase
    .from('donation_transactions')
    .select('amount')
    .eq('status', 'confirmed');
  const totalMYR = (donationSum ?? []).reduce((s, d) => s + Number(d.amount), 0);

  // Featured: top 3 listed orgs by Amanah score
  const { data: listedOrgs } = await supabase
    .from('organizations')
    .select(`
      id, name, summary, org_type, state, fund_types,
      amanah_index_history ( score_value, computed_at ),
      certification_history ( new_status, decided_at )
    `)
    .eq('listing_status', 'listed')
    .order('updated_at', { ascending: false })
    .limit(12);

  const featured = (listedOrgs ?? [])
    .map((org) => {
      const scores = (org.amanah_index_history ?? []) as any[];
      const certs  = (org.certification_history ?? []) as any[];
      const latest = scores.sort((a: any, b: any) =>
        new Date(b.computed_at).getTime() - new Date(a.computed_at).getTime())[0];
      const cert = certs.sort((a: any, b: any) =>
        new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime())[0];
      return { ...org, score: latest ? Number(latest.score_value) : null, certified: cert?.new_status === 'certified' };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pattern-bg text-white py-20 px-4 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute left-0 bottom-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Bismillah / Ayah */}
          <p className="text-emerald-300 text-[12px] font-medium tracking-widest uppercase mb-6">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </p>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            Give with Confidence.<br />
            <span className="text-emerald-300">Give with Amanah.</span>
          </h1>

          <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-3 leading-relaxed">
            Every charity on AmanahHub has been independently reviewed for governance, financial transparency, and Shariah compliance — so you know your Sadaqah reaches those who need it most.
          </p>

          <p className="text-emerald-200/70 text-[13px] italic mb-8">
            "Kind speech and forgiveness are better than charity followed by injury." — Al-Baqarah 2:263
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/charities"
              className="px-8 py-3.5 bg-white text-emerald-800 rounded-lg font-semibold
                         text-[15px] hover:bg-emerald-50 transition-colors shadow-lg">
              Browse verified charities →
            </Link>
            <Link href="/how-it-works"
              className="px-8 py-3.5 border border-emerald-400 text-emerald-100
                         rounded-lg font-medium text-[15px] hover:bg-emerald-700/50 transition-colors">
              How we verify
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLATFORM STATS ───────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat value={orgCount ?? 0}  unit="" label="Verified organizations" color="emerald" />
          <Stat value={reportCount ?? 0} unit="" label="Reports verified" color="emerald" />
          <Stat value={donationCount ?? 0} unit="" label="Donations processed" />
          <Stat
            value={totalMYR > 0
              ? `MYR ${(totalMYR / 1000).toFixed(0)}K`
              : 'MYR 0'}
            unit=""
            label="Channelled to charities"
            raw
          />
        </div>
      </section>

      {/* ── FEATURED ORGANIZATIONS ───────────────────────────── */}
      <section className="section bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest mb-2">
              Trusted organizations
            </p>
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">
              Give to verified, transparent charities
            </h2>
            <p className="text-gray-500 text-[15px] max-w-xl mx-auto">
              Every organization has been reviewed against the Charity Transparency Certification Framework (CTCF) and scored on the Amanah Index™.
            </p>
          </div>

          {featured.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-5 mb-8">
              {featured.map((org) => (
                <div key={org.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5
                             hover:border-emerald-200 hover:shadow-md transition-all group">

                  {/* Score ring + title */}
                  <div className="flex items-start gap-3 mb-3">
                    {org.score !== null ? (
                      <ScoreRing score={org.score} size="md" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-100 ring-1 ring-gray-200
                                      flex items-center justify-center text-gray-300 text-xs">—</div>
                    )}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <Link href={`/charities/${org.id}`}
                        className="text-[13px] font-semibold text-gray-900 hover:text-emerald-800
                                   transition-colors leading-snug truncate block">
                        {org.name}
                      </Link>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : ''}
                        {org.state ? ` · ${org.state}` : ''}
                      </p>
                      {/* Badges */}
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {org.certified && (
                          <span className="badge badge-green">
                            <svg className="w-2.5 h-2.5 mr-0.5" viewBox="0 0 10 10" fill="none">
                              <path d="M8.5 2.5L4 7.5 1.5 5" stroke="currentColor" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Certified
                          </span>
                        )}
                        {org.score !== null && (
                          <span className={`badge ${
                            scoreTier(org.score) === 'platinum' ? 'badge-purple' :
                            scoreTier(org.score) === 'gold'     ? 'badge-amber'  : 'badge-gray'
                          }`}>
                            {tierLabel(scoreTier(org.score))} Amanah
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {org.summary && (
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
                      {org.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <Link href={`/charities/${org.id}`}
                      className="text-[11px] text-emerald-700 font-medium hover:underline">
                      View profile →
                    </Link>
                    <Link href={`/donate/${org.id}`}
                      className="text-[11px] bg-emerald-700 text-white px-3 py-1 rounded-md
                                 hover:bg-emerald-800 transition-colors">
                      Donate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No verified organizations yet.</p>
            </div>
          )}

          <div className="text-center">
            <Link href="/charities"
              className="inline-flex items-center gap-2 px-6 py-3 border border-emerald-200
                         text-emerald-700 rounded-lg font-medium text-[14px]
                         hover:bg-emerald-50 transition-colors">
              Browse all {orgCount ?? 0} verified organizations
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="section bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest mb-2">Simple process</p>
            <h2 className="font-display text-3xl font-bold text-gray-900">
              How AmanahHub works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Discover',
                desc: 'Browse our directory of verified Malaysian Islamic charities. Filter by type, state, or Amanah score to find causes that matter to you.',
                icon: '🔍',
                color: 'bg-blue-50 text-blue-700',
              },
              {
                step: '02',
                title: 'Verify',
                desc: 'Each charity has a transparent Amanah score backed by real documentation — governance structure, audited financials, project reports, and Shariah compliance.',
                icon: '✓',
                color: 'bg-emerald-50 text-emerald-700',
              },
              {
                step: '03',
                title: 'Give',
                desc: 'Donate directly to the charity via secure payment. AmanahHub is non-custodial — your funds go straight to them. No middleman holds your money.',
                icon: '♡',
                color: 'bg-amber-50 text-amber-700',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center
                                 text-xl mb-4`}>
                  {item.icon}
                </div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">
                  Step {item.step}
                </p>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/how-it-works"
              className="text-[13px] text-emerald-700 font-medium hover:underline">
              Learn more about our verification process →
            </Link>
          </div>
        </div>
      </section>

      {/* ── AMANAH INDEX EXPLAINER ───────────────────────────── */}
      <section className="section bg-emerald-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border border-white rounded-full" />
          <div className="absolute top-10 left-10 w-48 h-48 border border-white rounded-full" />
          <div className="absolute bottom-10 right-10 w-24 h-24 border border-white rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-emerald-400 text-[11px] font-medium uppercase tracking-widest mb-3">
                Built on Amanah
              </p>
              <h2 className="font-display text-3xl font-bold mb-4">
                The Amanah Index™ — a trust score you can actually understand
              </h2>
              <p className="text-emerald-100 text-[14px] leading-relaxed mb-5">
                Every organization earns a score from 0 to 100 based on five dimensions. The score is computed from verified data — not self-reporting — and updated whenever a report is verified or certification is renewed.
              </p>
              <Link href="/how-it-works#amanah"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600
                           hover:bg-emerald-500 rounded-lg text-[13px] font-medium
                           transition-colors text-white">
                Understand the scoring →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Governance',    pct: 30, desc: 'Board structure, legal docs, conflict of interest' },
                { label: 'Financial',     pct: 25, desc: 'Audited accounts, program expense ratio' },
                { label: 'Project',       pct: 20, desc: 'Geo-verified reports, beneficiary metrics' },
                { label: 'Impact',        pct: 15, desc: 'KPIs, sustainability, continuity tracking' },
                { label: 'Shariah',       pct: 15, desc: 'Named advisor, written policy, fund governance' },
              ].map((dim) => (
                <div key={dim.label}
                  className="bg-emerald-800/60 rounded-xl p-3.5 border border-emerald-700/50">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[12px] font-semibold text-white">{dim.label}</span>
                    <span className="text-[11px] text-emerald-400">{dim.pct}%</span>
                  </div>
                  <p className="text-[10px] text-emerald-300 leading-snug">{dim.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ISLAMIC GOVERNANCE SECTION ───────────────────────── */}
      <section className="section bg-amber-50 border-y border-amber-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-medium text-amber-700 uppercase tracking-widest mb-2">
              Grounded in Islamic principles
            </p>
            <h2 className="font-display text-3xl font-bold text-gray-900">
              Amanah is not just a score — it is a covenant
            </h2>
            <p className="text-gray-600 text-[14px] max-w-2xl mx-auto mt-3 leading-relaxed">
              The Quran designates those who manage charity (<em>Al-'Amilina 'Alayha</em>) as a recognised category with specific responsibilities. AmanahHub operationalises these obligations into verifiable, auditable standards.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                arabic: 'أمانة',
                title: 'Amanah — Trustworthiness',
                ayah: '"And do not consume one another\'s wealth unjustly…"',
                ref: 'Al-Baqarah 2:188',
                desc: 'Every charity administrator is a trustee of donor funds. Our governance review verifies that structures exist to protect that trust.',
              },
              {
                arabic: 'شفافية',
                title: 'Shafafiyyah — Transparency',
                ayah: '"Kind speech and forgiveness are better than charity followed by injury."',
                ref: 'Al-Baqarah 2:263',
                desc: 'We require detailed project reports and financial statements — not for bureaucracy, but to honour the dignity of both donors and recipients.',
              },
              {
                arabic: 'مساءلة',
                title: "Mas'uliyyah — Accountability",
                ayah: '"Allah does not burden a soul beyond that it can bear."',
                ref: 'Al-Baqarah 2:286',
                desc: 'The Prophet ﷺ held charity collectors accountable for every dirham. Our CTCF framework reflects that same standard in a verifiable form.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-5 border border-amber-100">
                <p className="font-display text-3xl text-amber-600 mb-2">{item.arabic}</p>
                <h3 className="font-semibold text-[13px] text-gray-900 mb-2">{item.title}</h3>
                <p className="text-[12px] text-gray-500 italic mb-1 leading-relaxed">
                  {item.ayah}
                </p>
                <p className="text-[10px] text-amber-600 mb-3">{item.ref}</p>
                <p className="text-[12px] text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DONATION TRUST BANNER ────────────────────────────── */}
      <section className="section-tight bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-emerald-700 rounded-2xl p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.1) 15px, rgba(255,255,255,0.1) 16px)',
              }}
            />
            <div className="relative z-10">
              <p className="text-emerald-200 text-[12px] uppercase tracking-widest mb-2">
                Non-custodial platform
              </p>
              <h2 className="font-display text-2xl font-bold mb-3">
                Your donation goes directly to the charity.
              </h2>
              <p className="text-emerald-100 text-[14px] max-w-xl mx-auto mb-6 leading-relaxed">
                AmanahHub never holds your funds. When you donate, your payment goes straight to the organization via ToyyibPay. We only record and verify. Your Sadaqah reaches its destination intact.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/charities"
                  className="px-7 py-3 bg-white text-emerald-800 rounded-lg font-semibold
                             text-[14px] hover:bg-emerald-50 transition-colors">
                  Start giving →
                </Link>
                <Link href="/how-it-works#donations"
                  className="px-7 py-3 border border-emerald-400 text-white rounded-lg
                             font-medium text-[14px] hover:bg-emerald-600 transition-colors">
                  How donations work
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function Stat({ value, unit, label, color, raw }: {
  value: number | string; unit: string; label: string;
  color?: string; raw?: boolean;
}) {
  return (
    <div>
      <p className={`text-3xl font-bold ${color === 'emerald' ? 'text-emerald-700' : 'text-gray-900'}`}>
        {raw ? value : typeof value === 'number' ? value.toLocaleString() : value}
        {unit}
      </p>
      <p className="text-[12px] text-gray-500 mt-1">{label}</p>
    </div>
  );
}
