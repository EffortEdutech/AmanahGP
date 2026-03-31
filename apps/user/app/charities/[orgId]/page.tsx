// apps/user/app/charities/[orgId]/page.tsx
// AmanahHub — Public organization profile (Sprint 11)
// Shows verified documents to donors: governance, financial, Shariah.
// Only documents where is_approved_public = true are shown.

import { notFound }      from 'next/navigation';
import Link              from 'next/link';
import { createClient }  from '@/lib/supabase/server';
import { ScoreRing, scoreTier, tierLabel } from '@/components/ui/score-ring';
import { StatusBadge }   from '@/components/ui/badge';

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo: 'NGO / Welfare', mosque_surau: 'Mosque / Surau',
  waqf_institution: 'Waqf Institution', zakat_body: 'Zakat Body',
  foundation: 'Foundation', other: 'Other',
};

const DOC_TYPE_LABELS: Record<string, string> = {
  registration_cert:            'Registration certificate',
  governing_doc:                'Governing document',
  board_resolution:             'Board list / resolution',
  coi_policy:                   'Conflict of interest policy',
  annual_report:                'Annual report',
  financial_statement:          'Annual financial statement',
  audit_report:                 'Audit report',
  bank_reconciliation:          'Bank reconciliation',
  management_accounts:          'Program expense breakdown',
  shariah_policy:               'Shariah compliance policy',
  shariah_advisor_credentials:  'Shariah advisor credentials',
  zakat_authorization:          'Zakat authorization',
  waqf_deed:                    'Waqf asset deed',
  fatwa_doc:                    'Shariah ruling',
};

const DOC_CATEGORY_LABELS: Record<string, string> = {
  governance: 'Governance',
  financial:  'Financial',
  shariah:    'Shariah',
};

export default async function OrgPublicProfilePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase  = await createClient();

  // Only listed orgs
  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url, contact_email,
      state, org_type, oversight_authority, fund_types, summary,
      onboarding_status, listing_status
    `)
    .eq('id', orgId)
    .eq('listing_status', 'listed')
    .single();

  if (!org) notFound();

  // Latest Amanah score
  const { data: scores } = await supabase
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at, breakdown, public_summary')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1);

  const latestScore = scores?.[0] ? Number(scores[0].score_value) : null;
  const breakdown   = scores?.[0]?.breakdown as Record<string, any> ?? null;

  // Latest certification
  const { data: certs } = await supabase
    .from('certification_history')
    .select('new_status, valid_from, valid_to, decided_at')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(1);
  const cert = certs?.[0];

  // Verified projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, objective, status, start_date')
    .eq('organization_id', orgId)
    .eq('is_public', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(5);

  // PUBLIC documents only (approved by reviewer)
  const { data: publicDocs } = await supabase
    .from('org_documents')
    .select('id, document_category, document_type, label, file_name, period_year, approved_at')
    .eq('organization_id', orgId)
    .eq('is_approved_public', true)
    .order('document_category')
    .order('period_year', { ascending: false });

  // Group docs by category
  const docsByCategory: Record<string, typeof publicDocs> = {};
  for (const doc of publicDocs ?? []) {
    const cat = doc.document_category;
    docsByCategory[cat] = [...(docsByCategory[cat] ?? []), doc];
  }

  const fundTypes = (org.fund_types ?? []) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <Link href="/charities"
          className="text-[12px] text-gray-400 hover:text-emerald-700 mb-5 block">
          ← Back to directory
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Score ring */}
            {latestScore !== null ? (
              <ScoreRing score={latestScore} size="xl" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 ring-2 ring-gray-200
                              flex items-center justify-center text-gray-400 text-sm
                              flex-shrink-0">—</div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-bold text-gray-900">{org.name}</h1>
              {org.legal_name && org.legal_name !== org.name && (
                <p className="text-[12px] text-gray-400 mt-0.5">{org.legal_name}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mt-2">
                {cert?.new_status === 'certified' && (
                  <span className="badge badge-green">✓ Certified</span>
                )}
                {latestScore !== null && (
                  <span className={`badge ${
                    scoreTier(latestScore) === 'platinum' ? 'badge-purple' :
                    scoreTier(latestScore) === 'gold'     ? 'badge-amber'  : 'badge-gray'
                  }`}>
                    {latestScore.toFixed(1)} — {tierLabel(scoreTier(latestScore))} Amanah
                  </span>
                )}
                {org.org_type && (
                  <span className="badge badge-blue">
                    {ORG_TYPE_LABELS[org.org_type] ?? org.org_type}
                  </span>
                )}
                {org.state && (
                  <span className="badge badge-gray">{org.state}</span>
                )}
                {fundTypes.map((f) => (
                  <span key={f} className="badge badge-green">{f.toUpperCase()}</span>
                ))}
              </div>

              {org.summary && (
                <p className="text-[13px] text-gray-600 mt-3 leading-relaxed max-w-2xl">
                  {org.summary}
                </p>
              )}
            </div>

            {/* Donate CTA */}
            <div className="flex-shrink-0">
              <Link href={`/donate/${org.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700
                           text-white rounded-xl font-semibold text-[14px]
                           hover:bg-emerald-800 transition-colors shadow-sm">
                Donate →
              </Link>
              {cert?.valid_to && (
                <p className="text-[10px] text-gray-400 text-center mt-1.5">
                  Cert valid to {new Date(cert.valid_to).toLocaleDateString('en-MY', {
                    month: 'short', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* CTCF score breakdown bars */}
          {breakdown && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3">
                Amanah score breakdown
              </p>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { key: 'governance', label: 'Governance', max: 20 },
                  { key: 'financial',  label: 'Financial',  max: 20 },
                  { key: 'project',    label: 'Project',    max: 25 },
                  { key: 'impact',     label: 'Impact',     max: 20 },
                  { key: 'shariah',    label: 'Shariah',    max: 15 },
                ].map(({ key, label, max }) => {
                  const dim   = breakdown[key] ?? {};
                  const val   = dim.score ?? 0;
                  const pct   = (val / max) * 100;
                  return (
                    <div key={key} className="text-center">
                      <div className="h-16 bg-gray-100 rounded-lg relative overflow-hidden mb-1">
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-emerald-600 rounded-b-lg
                                     transition-all"
                          style={{ height: `${pct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center
                                         text-[11px] font-semibold text-gray-700">
                          {val}/{max}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500">{label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5">

          {/* LEFT 2/3: Projects + Documents */}
          <div className="md:col-span-2 space-y-5">

            {/* Active projects */}
            {(projects ?? []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-[14px] font-semibold text-gray-900 mb-4">Active projects</h2>
                <div className="space-y-3">
                  {projects!.map((proj) => (
                    <Link key={proj.id}
                      href={`/charities/${orgId}/projects/${proj.id}`}
                      className="block border border-gray-200 rounded-xl p-3.5
                                 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                      <p className="text-[13px] font-semibold text-gray-900">{proj.title}</p>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                        {proj.objective}
                      </p>
                    </Link>
                  ))}
                </div>
                <Link href={`/charities/${orgId}/projects`}
                  className="block text-[11px] text-emerald-700 hover:underline mt-3">
                  View all projects →
                </Link>
              </div>
            )}

            {/* PUBLIC DOCUMENTS — transparency evidence for donors */}
            {Object.keys(docsByCategory).length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-[14px] font-semibold text-gray-900">Transparency documents</h2>
                  <span className="badge badge-green">Reviewer approved</span>
                </div>
                <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
                  The following documents have been reviewed and approved by AmanahHub reviewers
                  as part of the CTCF certification process.
                </p>

                {Object.entries(docsByCategory).map(([category, docs]) => (
                  <div key={category} className="mb-4">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                      {DOC_CATEGORY_LABELS[category] ?? category}
                    </p>
                    <div className="space-y-2">
                      {docs!.map((doc) => (
                        <div key={doc.id}
                          className="flex items-center gap-3 border border-gray-200 rounded-lg
                                     px-3 py-2.5 bg-gray-50/50">
                          <span className="text-lg flex-shrink-0">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-gray-800">
                              {DOC_TYPE_LABELS[doc.document_type] ?? doc.label}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {doc.file_name}
                              {doc.period_year ? ` · ${doc.period_year}` : ''}
                            </p>
                          </div>
                          <a
                            href={`/api/public/orgs/${orgId}/documents/${doc.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-700 hover:text-emerald-900
                                       font-medium underline flex-shrink-0"
                          >
                            View PDF
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="text-[14px] font-semibold text-gray-900 mb-2">Transparency documents</h2>
                <p className="text-[12px] text-gray-400">
                  No documents have been publicly approved yet for this organization.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT 1/3: Info sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
                Organization details
              </p>
              <div className="space-y-2 text-[12px]">
                {org.registration_no && (
                  <div>
                    <p className="text-gray-400">Registration</p>
                    <p className="font-medium text-gray-800">{org.registration_no}</p>
                  </div>
                )}
                {org.oversight_authority && (
                  <div>
                    <p className="text-gray-400">Oversight</p>
                    <p className="font-medium text-gray-800">{org.oversight_authority}</p>
                  </div>
                )}
                {org.website_url && (
                  <div>
                    <p className="text-gray-400">Website</p>
                    <a href={org.website_url} target="_blank" rel="noopener noreferrer"
                      className="font-medium text-emerald-700 hover:underline truncate block">
                      {org.website_url.replace('https://', '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Non-custodial trust notice */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
              <p className="text-[11px] font-semibold text-emerald-800 mb-1">
                Direct giving guarantee
              </p>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                AmanahHub is non-custodial. Your donation goes directly to this organization.
                We never hold your funds.
              </p>
            </div>

            <Link href={`/donate/${org.id}`}
              className="block w-full text-center bg-emerald-700 text-white rounded-xl
                         py-3 font-semibold text-[14px] hover:bg-emerald-800 transition-colors">
              Donate now
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
