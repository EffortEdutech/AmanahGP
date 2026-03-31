// apps/admin/app/(dashboard)/orgs/[orgId]/certification/page.tsx
// AmanahHub Console — Certification page with Shariah document uploads (Sprint 11)
// Layer 5: Shariah governance docs required before CTCF evaluation

import { redirect }              from 'next/navigation';
import Link                      from 'next/link';
import { createClient,
         createServiceClient }   from '@/lib/supabase/server';
import { StatusBadge }           from '@/components/ui/badge';
import { ScoreRing, scoreTier,
         tierLabel }             from '@/components/ui/score-ring';
import { DocumentUploadPanel }   from '@/components/documents/document-upload-panel';
import type { DocumentSpec }     from '@/components/documents/document-upload-panel';
import { ApplyCertButton }       from '@/components/certification/apply-cert-button';
import { applyForCertification } from './actions';

const SHARIAH_SPECS: DocumentSpec[] = [
  {
    documentType:  'shariah_advisor_credentials',
    label:         'Shariah advisor credentials',
    description:   'Qualification certificate, appointment letter, or CV of named Shariah advisor or SSB member. Required for CTCF Layer 5.',
    required:      true,
    acceptedTypes: 'application/pdf,image/*',
  },
  {
    documentType:  'shariah_policy',
    label:         'Written Shariah compliance policy',
    description:   'Formal document stating the organization\'s Shariah principles, fund management rules, and compliance procedures.',
    required:      true,
    acceptedTypes: 'application/pdf',
  },
  {
    documentType:  'zakat_authorization',
    label:         'Zakat authorization certificate',
    description:   'State Zakat authority authorization if your organization collects or distributes Zakat. Leave blank if not applicable.',
    required:      false,
    acceptedTypes: 'application/pdf,image/*',
  },
  {
    documentType:  'waqf_deed',
    label:         'Waqf asset protection deed',
    description:   'Trust deed or waqf instrument for assets under management. Required only for waqf institutions.',
    required:      false,
    acceptedTypes: 'application/pdf',
  },
  {
    documentType:  'fatwa_doc',
    label:         'Relevant fatwa or Shariah ruling',
    description:   'Any fatwa issued by the organization\'s SSB or a recognized authority relevant to fund management practices.',
    required:      false,
    acceptedTypes: 'application/pdf',
  },
];

export default async function CertificationPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase  = await createClient();
  const svc       = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: canEdit } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_manager' });

  // Org basic info
  const { data: org } = await svc
    .from('organizations')
    .select('id, name, onboarding_status, listing_status')
    .eq('id', orgId).single();
  if (!org) redirect('/dashboard');

  // Certification applications
  const { data: apps } = await svc
    .from('certification_applications')
    .select(`
      id, status, submitted_at, reviewer_comment,
      certification_evaluations (
        id, total_score, score_breakdown, computed_at, criteria_version
      )
    `)
    .eq('organization_id', orgId)
    .order('submitted_at', { ascending: false });

  // Amanah score history
  const { data: scoreHistory } = await svc
    .from('amanah_index_history')
    .select('id, score_value, score_version, computed_at, breakdown, public_summary')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(5);

  // Certification history
  const { data: certHistory } = await svc
    .from('certification_history')
    .select('id, new_status, valid_from, valid_to, decided_at, decision_reason')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false });

  // Shariah documents
  const { data: shariahDocs } = await svc
    .from('org_documents')
    .select(`
      id, document_type, label, file_name, file_size_bytes, mime_type,
      is_approved_public, visibility, period_year, created_at
    `)
    .eq('organization_id', orgId)
    .eq('document_category', 'shariah')
    .order('created_at', { ascending: false });

  const latestApp   = apps?.[0];
  const latestScore = scoreHistory?.[0];
  const latestCert  = certHistory?.[0];
  const latestEval  = (latestApp?.certification_evaluations as any[])?.[0];

  const isPending    = latestApp?.status === 'submitted' || latestApp?.status === 'under_review';
  const isApproved   = latestCert?.new_status === 'certified';
  const canApply     = canEdit &&
                       org.onboarding_status === 'approved' &&
                       !isPending;

  const score     = latestScore ? Number(latestScore.score_value) : null;
  const breakdown = latestEval?.score_breakdown as Record<string, any> ?? null;

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <Link href={`/orgs/${orgId}`}
          className="text-[11px] text-gray-400 hover:text-emerald-700 mb-3 block">
          ← Organization
        </Link>
        <h1 className="text-[18px] font-semibold text-gray-900">Certification</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">
          CTCF evaluation and Amanah Index™ history
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* LEFT: current status + score */}
        <div>
          {/* Current Amanah score */}
          {score !== null ? (
            <div className="card p-4 mb-4">
              <p className="sec-label">Amanah Index™</p>
              <div className="flex items-center gap-4 mt-2">
                <ScoreRing score={score} size="lg" />
                <div>
                  <p className="text-[22px] font-bold text-gray-900">{score.toFixed(1)}</p>
                  <p className={`text-[12px] font-medium mt-0.5 ${
                    scoreTier(score) === 'platinum' ? 'text-violet-700' :
                    scoreTier(score) === 'gold'     ? 'text-amber-600'  :
                    scoreTier(score) === 'silver'   ? 'text-gray-600'   : 'text-gray-400'
                  }`}>
                    {tierLabel(scoreTier(score))} Amanah
                  </p>
                  {latestCert?.valid_to && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Valid until {new Date(latestCert.valid_to).toLocaleDateString('en-MY', {
                        month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {latestScore?.public_summary && (
                <p className="text-[11px] text-gray-500 mt-3 leading-relaxed border-t
                              border-gray-100 pt-3">
                  {latestScore.public_summary}
                </p>
              )}
            </div>
          ) : (
            <div className="card p-4 mb-4">
              <p className="sec-label">Amanah Index™</p>
              <p className="text-[12px] text-gray-400 mt-2">
                No score yet. Complete CTCF evaluation to receive your Amanah Index score.
              </p>
            </div>
          )}

          {/* Score breakdown */}
          {breakdown && (
            <div className="card p-4 mb-4">
              <p className="sec-label">CTCF score breakdown</p>
              <div className="space-y-2 mt-2">
                {[
                  { key: 'governance', label: 'Layer 1 — Governance',  max: 20, gate: true },
                  { key: 'financial',  label: 'Layer 2 — Financial',   max: 20 },
                  { key: 'project',    label: 'Layer 3 — Project',     max: 25 },
                  { key: 'impact',     label: 'Layer 4 — Impact',      max: 20 },
                  { key: 'shariah',    label: 'Layer 5 — Shariah',     max: 15 },
                ].map(({ key, label, max, gate }) => {
                  const dim   = breakdown[key] ?? {};
                  const score_val = dim.score ?? null;
                  const pct   = score_val !== null ? (score_val / max) * 100 : 0;

                  return (
                    <div key={key}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-gray-700">{label}</span>
                        <span className="text-gray-500">
                          {score_val !== null ? `${score_val} / ${max}` : '—'}
                          {gate && (
                            <span className={`ml-1 ${dim.gate_passed ? 'text-emerald-600' : 'text-red-600'}`}>
                              {dim.gate_passed ? '✓' : '✗'}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between text-[12px] font-semibold pt-2
                                border-t border-gray-100">
                  <span>Total score</span>
                  <span>{breakdown.total ?? latestEval?.total_score ?? '—'} / 100</span>
                </div>
              </div>
            </div>
          )}

          {/* Apply button */}
          {canApply && (
            <ApplyCertButton action={applyForCertification} orgId={orgId} />
          )}
          {isPending && (
            <div className="card p-4 text-[12px] text-amber-700 bg-amber-50 border-amber-200">
              Application submitted — under review by our team.
            </div>
          )}
        </div>

        {/* RIGHT: history + Shariah docs */}
        <div>
          {/* Cert history */}
          {(certHistory ?? []).length > 0 && (
            <div className="card p-4 mb-4">
              <p className="sec-label">Certification history</p>
              <div className="space-y-2 mt-1">
                {certHistory!.map((ch) => (
                  <div key={ch.id} className="flex items-start justify-between gap-2 py-2
                                               border-b border-gray-100 last:border-0">
                    <div>
                      <p className={`text-[12px] font-medium ${
                        ch.new_status === 'certified' ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        {ch.new_status === 'certified' ? 'Certified' : 'Not certified'}
                      </p>
                      {ch.valid_from && ch.valid_to && (
                        <p className="text-[10px] text-gray-400">
                          {new Date(ch.valid_from).toLocaleDateString('en-MY')} —{' '}
                          {new Date(ch.valid_to).toLocaleDateString('en-MY')}
                        </p>
                      )}
                      {ch.decision_reason && (
                        <p className="text-[10px] text-gray-500 mt-0.5 italic">
                          {ch.decision_reason}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {new Date(ch.decided_at).toLocaleDateString('en-MY')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amanah score history */}
          {(scoreHistory ?? []).length > 0 && (
            <div className="card p-4 mb-4">
              <p className="sec-label">Score history</p>
              <div className="space-y-2 mt-1">
                {scoreHistory!.map((sh) => (
                  <div key={sh.id} className="flex items-center justify-between py-1.5
                                               border-b border-gray-100 last:border-0">
                    <div>
                      <span className="text-[13px] font-semibold text-gray-900">
                        {Number(sh.score_value).toFixed(1)}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">{sh.score_version}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(sh.computed_at).toLocaleDateString('en-MY')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SHARIAH DOCUMENTS — full width */}
      <DocumentUploadPanel
        orgId={orgId}
        category="shariah"
        title="Layer 5 — Shariah governance documents"
        specs={SHARIAH_SPECS}
        existingDocs={(shariahDocs ?? []).map((d) => ({
          ...d,
          uploaded_at: d.created_at,
        }))}
        readOnly={!canEdit}
      />

      {/* Layer 5 guidance */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-[12px]
                      text-amber-800 leading-relaxed mt-1">
        <p className="font-medium mb-1">CTCF Layer 5 — Shariah Governance (15% of score)</p>
        <p>
          Upload your Shariah advisor's credentials and written Shariah compliance policy.
          These documents are reviewed against AAOIFI Auditing Standard No. 6 and GSIFI No. 2.
          Organizations handling Zakat must additionally upload their state authority authorization.
          Waqf institutions must upload the waqf deed for asset protection verification.
        </p>
      </div>
    </div>
  );
}
