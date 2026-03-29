// apps/user/app/charities/[orgId]/page.tsx
// AmanahHub — Public charity profile page

import { notFound }     from 'next/navigation';
import Link             from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AmanahScorePanel } from '@/components/charity/amanah-score-panel';
import { CertPanel }        from '@/components/charity/cert-panel';

interface Props { params: Promise<{ orgId: string }> }

export async function generateMetadata({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();
  const { data }  = await supabase
    .from('organizations').select('name, summary').eq('id', orgId).single();
  return {
    title: data?.name ?? 'Charity Profile',
    description: data?.summary ?? '',
  };
}

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo: 'NGO / Welfare Association', mosque_surau: 'Mosque / Surau',
  waqf_institution: 'Waqf Institution', zakat_body: 'Zakat Body',
  foundation: 'Foundation', cooperative: 'Cooperative', other: 'Other',
};

export default async function CharityProfilePage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url, state,
      org_type, oversight_authority, fund_types, summary
    `)
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  // Latest Amanah score
  const { data: scoreHistory } = await supabase
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at, public_summary, breakdown')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(5);

  // Latest certification
  const { data: certHistory } = await supabase
    .from('certification_history')
    .select('new_status, valid_from, valid_to, decided_at')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(3);

  // Latest evaluation score breakdown
  const { data: latestEval } = await supabase
    .from('certification_evaluations')
    .select('total_score, score_breakdown, criteria_version, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Public projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, objective, location_text, status, start_date, end_date')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const latestScore = scoreHistory?.[0];
  const latestCert  = certHistory?.[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/charities" className="text-sm text-emerald-700 hover:text-emerald-800">
          ← Charity directory
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          {org.legal_name && org.legal_name !== org.name && (
            <p className="text-sm text-gray-400 mt-0.5">{org.legal_name}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {org.org_type ? ORG_TYPE_LABELS[org.org_type] : ''}
            {org.state ? ` · ${org.state}` : ''}
            {org.registration_no ? ` · Reg: ${org.registration_no}` : ''}
          </p>
        </div>

        <Link
          href={`/donate/${org.id}`}
          className="inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-semibold
                     text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm">
          Donate now
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Summary */}
          {org.summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                About
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{org.summary}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
                {org.website_url && (
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline">
                    {org.website_url.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {org.oversight_authority && (
                  <span>Overseen by: {org.oversight_authority}</span>
                )}
              </div>

              {org.fund_types?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(org.fund_types as string[]).map((f) => (
                    <span key={f}
                      className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Active projects ({projects?.length ?? 0})
            </h2>
            {projects?.length ? (
              <div className="space-y-3">
                {projects.map((p) => (
                  <Link key={p.id}
                    href={`/charities/${org.id}/projects/${p.id}`}
                    className="block p-5 bg-white rounded-xl border border-gray-200
                               hover:border-emerald-200 hover:shadow-sm transition-all group">
                    <h3 className="text-sm font-semibold text-gray-900
                                   group-hover:text-emerald-800 mb-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{p.objective}</p>
                    {(p.location_text || p.start_date) && (
                      <p className="text-xs text-gray-400 mt-2">
                        {p.location_text}
                        {p.location_text && p.start_date ? ' · ' : ''}
                        {p.start_date}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5
                              text-sm text-gray-400 text-center">
                No public projects yet.
              </div>
            )}
          </div>
        </div>

        {/* Right — trust panels */}
        <div className="space-y-4">
          <AmanahScorePanel
            latestScore={latestScore ? {
              value:         Number(latestScore.score_value),
              version:       latestScore.score_version,
              computedAt:    latestScore.computed_at,
              publicSummary: latestScore.public_summary,
              breakdown:     latestScore.breakdown as any,
            } : null}
            history={(scoreHistory ?? []).map((s) => ({
              value:      Number(s.score_value),
              computedAt: s.computed_at,
            }))}
          />

          <CertPanel
            latestCert={latestCert ? {
              status:    latestCert.new_status,
              validFrom: latestCert.valid_from,
              validTo:   latestCert.valid_to,
              decidedAt: latestCert.decided_at,
            } : null}
            evaluation={latestEval ? {
              totalScore:  Number(latestEval.total_score),
              version:     latestEval.criteria_version,
              computedAt:  latestEval.computed_at,
            } : null}
          />

          {/* Donate CTA */}
          <div className="bg-emerald-700 rounded-xl p-5 text-center">
            <p className="text-white text-sm font-medium mb-1">Support this organization</p>
            <p className="text-emerald-200 text-xs mb-4">
              Direct to charity. No funds held by platform.
            </p>
            <Link href={`/donate/${org.id}`}
              className="block w-full py-2.5 rounded-lg bg-white text-emerald-700
                         text-sm font-semibold hover:bg-emerald-50 transition-colors">
              Donate now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
