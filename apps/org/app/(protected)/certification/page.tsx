// apps/org/app/(protected)/certification/page.tsx
// amanahOS — CTCF Certification status view
// Org admins see their certification status and history here.
// Application is submitted via this page; evaluation happens in AmanahHub Console.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ComingSoonModule } from '@/components/ui/coming-soon-module';

export const metadata = { title: 'Certification — amanahOS' };

export default async function CertificationPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, org_role')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId = membership.organization_id;

  // Latest certification status
  const { data: latestCert } = await supabase
    .from('certification_history')
    .select('new_status, valid_from, valid_to, decided_at, decision_reason')
    .eq('organization_id', orgId)
    .order('decided_at', { ascending: false })
    .limit(1).maybeSingle();

  // Latest application
  const { data: latestApp } = await supabase
    .from('certification_applications')
    .select('id, status, submitted_at, reviewer_comment')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle();

  // Latest evaluation score
  const { data: latestEval } = await supabase
    .from('certification_evaluations')
    .select('total_score, criteria_version, computed_at')
    .eq('organization_id', orgId)
    .order('computed_at', { ascending: false })
    .limit(1).maybeSingle();

  const certStatus = latestCert?.new_status ?? null;
  const score      = latestEval?.total_score ?? null;

  const GRADE_MAP: Record<number, { label: string; color: string }> = {};
  function getGrade(s: number | null) {
    if (s === null) return { label: 'No score yet', color: 'text-gray-400' };
    if (s >= 85)   return { label: 'Platinum Amanah', color: 'text-purple-700' };
    if (s >= 70)   return { label: 'Gold Amanah',     color: 'text-amber-600' };
    if (s >= 55)   return { label: 'Silver Amanah',   color: 'text-gray-500' };
    return              { label: 'Not certified',      color: 'text-red-600' };
  }
  const grade = getGrade(score);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">CTCF Certification</h1>
        <p className="text-sm text-gray-500 mt-0.5">Charity Transparency Certification Framework</p>
      </div>

      {/* Current status card */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">
            {score !== null ? score.toFixed(1) : '—'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">out of 100</p>
        </div>
        <div className="flex-1">
          <p className={`text-lg font-semibold ${grade.color}`}>{grade.label}</p>
          {certStatus && (
            <p className="text-sm text-gray-500 mt-0.5 capitalize">
              Status: <span className="font-medium">{certStatus.replace(/_/g, ' ')}</span>
              {latestCert?.valid_from && ` · valid from ${latestCert.valid_from}`}
            </p>
          )}
          {latestEval && (
            <p className="text-[11px] text-gray-400 mt-1">
              {latestEval.criteria_version} ·{' '}
              {new Date(latestEval.computed_at).toLocaleDateString('en-MY')}
            </p>
          )}
        </div>
      </div>

      {/* Application status */}
      {latestApp && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-1">
          <p className="text-[11px] font-semibold text-gray-700">Latest application</p>
          <p className="text-sm text-gray-600 capitalize">
            Status: <span className="font-medium">{latestApp.status.replace(/_/g, ' ')}</span>
          </p>
          {latestApp.submitted_at && (
            <p className="text-[11px] text-gray-400">
              Submitted: {new Date(latestApp.submitted_at).toLocaleDateString('en-MY')}
            </p>
          )}
          {latestApp.reviewer_comment && (
            <p className="text-[11px] text-gray-600 mt-1 italic">"{latestApp.reviewer_comment}"</p>
          )}
        </div>
      )}

      {/* CTCF layers overview */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="px-4 py-3">
          <p className="text-[11px] font-semibold text-gray-700">CTCF scoring layers</p>
        </div>
        {[
          { layer: 'Layer 1', label: 'Legal & Governance Gate',       max: 'Pass/Fail' },
          { layer: 'Layer 2', label: 'Financial Transparency',        max: '20 pts' },
          { layer: 'Layer 3', label: 'Project Transparency',          max: '25 pts' },
          { layer: 'Layer 4', label: 'Impact & Sustainability',       max: '20 pts' },
          { layer: 'Layer 5', label: 'Shariah Governance',            max: '15 pts' },
        ].map((row) => (
          <div key={row.layer} className="px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-medium text-emerald-700 mr-2">{row.layer}</span>
              <span className="text-[12px] text-gray-700">{row.label}</span>
            </div>
            <span className="text-[10px] text-gray-400">{row.max}</span>
          </div>
        ))}
      </div>

      <ComingSoonModule
        label="Certification application"
        sprintTarget="Sprint 19"
        description="Submit your CTCF certification application directly from amanahOS. Reviewers evaluate via AmanahHub Console. Currently, applications are submitted through the Console."
        consoleLink
      />
    </div>
  );
}
