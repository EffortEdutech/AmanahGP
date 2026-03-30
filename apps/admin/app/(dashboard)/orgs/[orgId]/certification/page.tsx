// apps/admin/app/(dashboard)/orgs/[orgId]/certification/page.tsx
// AmanahHub Console — Certification status and application

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { StatusBadge }       from '@/components/ui/status-badge';
import { ApplyCertButton }   from '@/components/certification/apply-cert-button';
import { applyForCertification } from './actions';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Certification | AmanahHub Console' };

// Grade labels from CTCF spec
function gradeLabel(score: number) {
  if (score >= 85) return { label: 'Platinum Amanah', color: 'text-purple-700' };
  if (score >= 70) return { label: 'Gold Amanah',    color: 'text-amber-600' };
  if (score >= 55) return { label: 'Silver Amanah',  color: 'text-gray-600' };
  return              { label: 'Not Certified',       color: 'text-red-600' };
}

export default async function CertificationPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, onboarding_status')
    .eq('id', orgId).single();

  if (!org) redirect('/dashboard');

  // Active application
  const { data: activeApp } = await supabase
    .from('certification_applications')
    .select('id, status, submitted_at, reviewer_comment')
    .eq('organization_id', orgId)
    .in('status', ['draft', 'submitted', 'under_review'])
    .order('submitted_at', { ascending: false })
    .maybeSingle();

  // Latest evaluation
  const { data: latestEval } = await supabase
    .from('certification_evaluations')
    .select('id, total_score, score_breakdown, criteria_version, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Certification history
  const { data: history } = await supabase
    .from('certification_history')
    .select('id, new_status, valid_from, valid_to, decided_at, decision_reason')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(5);

  // Latest Amanah score
  const { data: latestScore } = await supabase
    .from('amanah_index_history')
    .select('score_value, score_version, computed_at, public_summary')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: isAdmin } = await supabase.rpc('org_role_at_least', {
    org_id: orgId, min_role: 'org_admin',
  });

  const isApproved = org.onboarding_status === 'approved';
  const canApply   = isAdmin && isApproved && !activeApp;
  const currentCert = history?.[0];
  const grade       = latestEval ? gradeLabel(Number(latestEval.total_score)) : null;
  const breakdown   = latestEval?.score_breakdown as Record<string, any> | null;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <a href={`/orgs/${orgId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
          ← {org.name}
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">Certification</h1>
        <p className="mt-1 text-sm text-gray-500">
          CTCF — Charity Transparency Certification Framework
        </p>
      </div>

      {/* Current status card */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
              Current certification status
            </p>
            {currentCert ? (
              <>
                <StatusBadge status={currentCert.new_status} size="md" />
                {currentCert.valid_to && (
                  <p className="text-xs text-gray-400 mt-1">
                    Valid until {new Date(currentCert.valid_to).toLocaleDateString('en-MY')}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No certification on record</p>
            )}
          </div>

          {latestEval && (
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {Number(latestEval.total_score).toFixed(1)}
              </p>
              <p className={`text-sm font-medium ${grade?.color}`}>{grade?.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{latestEval.criteria_version}</p>
            </div>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      {breakdown && (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Score breakdown
            </h2>
          </div>
          {[
            { key: 'layer1_gate',     label: 'Layer 1 — Legal & Governance Gate' },
            { key: 'layer2_financial', label: 'Layer 2 — Financial Transparency' },
            { key: 'layer3_project',  label: 'Layer 3 — Project Transparency' },
            { key: 'layer4_impact',   label: 'Layer 4 — Impact & Sustainability' },
            { key: 'layer5_shariah',  label: 'Layer 5 — Shariah Governance' },
          ].map(({ key, label }) => {
            const layer = breakdown[key];
            if (!layer) return null;
            return (
              <div key={key} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{label}</p>
                  {layer.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{layer.notes}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  {layer.passed !== undefined ? (
                    <span className={`text-sm font-semibold ${layer.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                      {layer.passed ? '✓ Pass' : '✗ Fail'}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">
                      {layer.score}/{layer.max}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Amanah Index score */}
      {latestScore && (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                Amanah Index™
              </p>
              <p className="text-sm text-gray-500">{latestScore.public_summary}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-700">
                {Number(latestScore.score_value).toFixed(1)}
              </p>
              <p className="text-xs text-gray-400">{latestScore.score_version}</p>
            </div>
          </div>
        </div>
      )}

      {/* Active application status */}
      {activeApp && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">Application under review</p>
              <p className="text-sm text-blue-700">
                Submitted {activeApp.submitted_at
                  ? new Date(activeApp.submitted_at).toLocaleDateString('en-MY')
                  : '—'}
              </p>
            </div>
            <StatusBadge status={activeApp.status} />
          </div>
          {activeApp.reviewer_comment && (
            <p className="mt-2 text-sm text-blue-800 border-t border-blue-100 pt-2">
              Reviewer note: {activeApp.reviewer_comment}
            </p>
          )}
        </div>
      )}

      {/* Certification history */}
      {history && history.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
          <div className="px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Certification history
            </h2>
          </div>
          {history.map((h) => (
            <div key={h.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div>
                <StatusBadge status={h.new_status} />
                {h.decision_reason && (
                  <p className="text-xs text-gray-400 mt-0.5">{h.decision_reason}</p>
                )}
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">
                {new Date(h.decided_at).toLocaleDateString('en-MY')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Apply button */}
      {!isApproved && (
        <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
          Your organization must be approved before applying for certification.
        </div>
      )}

      {canApply && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-5">
          <h3 className="text-sm font-semibold text-emerald-900 mb-1">
            Apply for CTCF certification
          </h3>
          <p className="text-sm text-emerald-700 mb-4">
            A reviewer will evaluate your governance documents, financial snapshot,
            project reports, and Shariah governance. Ensure your financial snapshot
            and at least one verified report are in place before applying.
          </p>
          <ApplyCertButton orgId={orgId} action={applyForCertification} />
        </div>
      )}
    </div>
  );
}
