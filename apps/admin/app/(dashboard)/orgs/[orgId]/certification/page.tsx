// apps/admin/app/(dashboard)/orgs/[orgId]/certification/page.tsx
// AmanahHub Console — Certification (Sprint 8 UI uplift)
// Matches UAT s-a-cert: current status card + score breakdown + history + apply CTA

import { redirect }    from 'next/navigation';
import Link            from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/ui/badge';
import { ScoreRing, scoreTier, tierLabel } from '@/components/ui/score-ring';
import { ApplyCertButton } from '@/components/certification/apply-cert-button';
import { applyForCertification } from './actions';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Certification | AmanahHub Console' };

export default async function CertificationPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, onboarding_status')
    .eq('id', orgId).single();
  if (!org) redirect('/dashboard');

  const { data: activeApp } = await supabase
    .from('certification_applications')
    .select('id, status, submitted_at, reviewer_comment')
    .eq('organization_id', orgId)
    .in('status', ['draft', 'submitted', 'under_review'])
    .order('submitted_at', { ascending: false })
    .maybeSingle();

  const { data: latestEval } = await supabase
    .from('certification_evaluations')
    .select('id, total_score, score_breakdown, criteria_version, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: history } = await supabase
    .from('certification_history')
    .select('id, new_status, valid_from, valid_to, decided_at, decision_reason')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(5);

  const { data: latestScore } = await supabase
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: isAdmin } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_admin' });

  const isApproved = org.onboarding_status === 'approved';
  const canApply   = isAdmin && isApproved && !activeApp;
  const currentCert = history?.[0];
  const isCertified = currentCert?.new_status === 'certified';
  const score       = latestEval ? Number(latestEval.total_score) : null;
  const breakdown   = latestEval?.score_breakdown as Record<string, any> | null;
  const amanahScore = latestScore ? Number(latestScore.score_value) : null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-semibold text-gray-900">Certification</h1>
        {canApply && <ApplyCertButton orgId={orgId} action={applyForCertification} />}
      </div>

      <div className="grid grid-cols-2 gap-4">

        {/* Left: current status + amanah score */}
        <div className="space-y-3">

          {/* Current cert status */}
          <div className={`card p-4 ${isCertified ? 'border-emerald-200 bg-emerald-50/30' : ''}`}>
            <p className="sec-label">Current status</p>
            {currentCert ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {amanahScore !== null ? (
                    <ScoreRing score={amanahScore} size="md" />
                  ) : null}
                  <div>
                    <StatusBadge status={currentCert.new_status} />
                    {score !== null && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        {tierLabel(scoreTier(score))} Amanah · CTCF {Math.round(score)}
                      </p>
                    )}
                  </div>
                </div>
                {isCertified && (
                  <div className="space-y-1">
                    {currentCert.valid_from && (
                      <Row label="Valid from" value={fmtDate(currentCert.valid_from)} />
                    )}
                    {currentCert.valid_to && (
                      <Row label="Valid to" value={fmtDate(currentCert.valid_to)} />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[12px] text-gray-400">No certification on record.</p>
            )}
          </div>

          {/* Active application */}
          {activeApp && (
            <div className="a-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[12px] font-medium text-amber-800">Application in progress</p>
                <StatusBadge status={activeApp.status} />
              </div>
              {activeApp.reviewer_comment && (
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                  {activeApp.reviewer_comment}
                </p>
              )}
            </div>
          )}

          {/* Cert history */}
          {(history?.length ?? 0) > 0 && (
            <div className="card p-4">
              <p className="sec-label">History</p>
              <div className="tl">
                {history!.map((h) => (
                  <div key={h.id} className="tli">
                    <p className="text-[12px] font-medium text-gray-800 capitalize">
                      {h.new_status.replace('_', ' ')}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {fmtDate(h.decided_at)}
                      {h.valid_to ? ` · valid to ${fmtDate(h.valid_to)}` : ''}
                    </p>
                    {h.decision_reason && (
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                        {h.decision_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: CTCF score breakdown */}
        <div>
          {latestEval && breakdown ? (
            <div className="card p-4">
              <p className="sec-label">
                CTCF evaluation · {latestEval.criteria_version}
              </p>

              {/* Total score */}
              <div className="g-card mb-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-emerald-800">Total CTCF score</p>
                    <p className="text-[10px] text-emerald-600">
                      {score !== null && score >= 55 ? '✓ Certifiable' : 'Below threshold'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[30px] font-semibold text-emerald-700 leading-none">
                      {score !== null ? Math.round(score) : '—'}
                    </span>
                    <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                      {score !== null ? `${tierLabel(scoreTier(score))} Amanah` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Layer breakdown */}
              <div className="space-y-3">
                {Object.entries(breakdown)
                  .filter(([, v]) => typeof v === 'object' && v !== null)
                  .map(([layer, data]: [string, any]) => (
                    <div key={layer}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[11px] font-medium text-gray-700 capitalize">
                          {layer.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {data.score ?? 0} / {data.max ?? '?'}
                        </span>
                      </div>
                      <div className="prog-wrap">
                        <div className="prog-fill"
                          style={{ width: `${Math.min(100, ((data.score ?? 0) / (data.max ?? 100)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <p className="text-[10px] text-gray-400 mt-3">
                Evaluated {new Date(latestEval.computed_at).toLocaleDateString('en-MY', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <p className="text-[12px] text-gray-400 mb-1">No CTCF evaluation on record.</p>
              <p className="text-[11px] text-gray-400">
                Submit a certification application to trigger an evaluation by a reviewer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[10px] text-gray-400 w-20 flex-shrink-0">{label}</span>
      <span className="text-[11px] text-gray-700">{value}</span>
    </div>
  );
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}
