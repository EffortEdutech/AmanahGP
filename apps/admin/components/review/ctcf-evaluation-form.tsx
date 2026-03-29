'use client';
// apps/admin/components/review/ctcf-evaluation-form.tsx
// AmanahHub Console — CTCF evaluation form (all 5 layers)
// Each criterion is a tri-state: Yes / No / N/A (where applicable)

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { certificationDecision } from '@/app/(dashboard)/review/certification-actions';

interface Props {
  appId:    string;
  orgId:    string;
  orgName:  string;
  hasZakat: boolean;
  hasWaqf:  boolean;
  action:   (prev: any, fd: FormData) => Promise<{
    error?: string; success?: boolean; score?: number; grade?: string;
  }>;
}

const initial = { error: undefined, success: false, score: undefined, grade: undefined };

// ── Small radio group for each criterion ──────────────────────
function CriterionRow({
  name, label, hint, includeNa = false,
}: {
  name: string; label: string; hint?: string; includeNa?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <label className="flex items-center gap-1 text-xs text-emerald-700 cursor-pointer">
          <input type="radio" name={name} value="true"  required className="accent-emerald-600" />
          Yes
        </label>
        <label className="flex items-center gap-1 text-xs text-red-600 cursor-pointer">
          <input type="radio" name={name} value="false" required className="accent-red-500" />
          No
        </label>
        {includeNa && (
          <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <input type="radio" name={name} value="na" className="accent-gray-400" />
            N/A
          </label>
        )}
      </div>
    </div>
  );
}

function LayerCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white mb-4">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export function CtcfEvaluationForm({ appId, orgId, orgName, hasZakat, hasWaqf, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const [showDecision, setShowDecision] = useState(false);
  const [decState, decFormAction, decPending] = useActionState(certificationDecision, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) setShowDecision(true);
  }, [state?.success]);

  useEffect(() => {
    if (decState?.success) router.push('/review/certification');
  }, [decState?.success, router]);

  return (
    <div>
      {/* Evaluation form */}
      {!showDecision && (
        <form action={formAction} className="space-y-0">
          <input type="hidden" name="appId" value={appId} />
          <input type="hidden" name="orgId" value={orgId} />

          {state?.error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* Layer 1: Gate */}
          <LayerCard title="Layer 1 — Legal & Governance Gate"
            subtitle="All must pass. Fail any item = Not Certifiable.">
            <CriterionRow name="l1_legal"    label="Legal identity / registration evidence" />
            <CriterionRow name="l1_governing" label="Governing document (constitution / bylaws)" />
            <CriterionRow name="l1_board"    label="Named board / committee / trustees" />
            <CriterionRow name="l1_coi"      label="Conflict of interest policy" />
            <CriterionRow name="l1_bank"     label="Org bank account separation (no personal accounts)" />
            <CriterionRow name="l1_contact"  label="Clear contact + physical address proof" />
          </LayerCard>

          {/* Layer 2: Financial (20 pts) */}
          <LayerCard title="Layer 2 — Financial Transparency"
            subtitle="5 pts each. Minimum 12/20 required for certification.">
            <CriterionRow name="l2_financial_statement" label="Annual financial statement provided" />
            <CriterionRow name="l2_audit"     label="Audit evidence (external or credible equivalent)" />
            <CriterionRow name="l2_breakdown" label="Program vs admin breakdown disclosed" />
            <CriterionRow name="l2_zakat"
              label="Zakat segregation & traceability"
              hint="Mark N/A if organization does not handle zakat funds"
              includeNa={!hasZakat} />
          </LayerCard>

          {/* Layer 3: Project (25 pts) */}
          <LayerCard title="Layer 3 — Project Transparency & Traceability"
            subtitle="5 pts each.">
            <CriterionRow name="l3_budget"      label="Project budget vs actual tracking" />
            <CriterionRow name="l3_geo"         label="Geo-verified reporting (location marker)" />
            <CriterionRow name="l3_before_after" label="Before/after documentation (where applicable)" />
            <CriterionRow name="l3_beneficiary" label="Beneficiary impact metrics with context" />
            <CriterionRow name="l3_timeliness"  label="Completion report timeliness" />
          </LayerCard>

          {/* Layer 4: Impact (20 pts) */}
          <LayerCard title="Layer 4 — Impact & Sustainability"
            subtitle="5 pts each.">
            <CriterionRow name="l4_kpis"         label="KPIs defined" />
            <CriterionRow name="l4_sustainability" label="Sustainability / maintenance plan" />
            <CriterionRow name="l4_continuity"   label="Continuity tracking cadence (jariah)" />
            <CriterionRow name="l4_impact_cost"  label="Impact-per-cost efficiency metric" />
          </LayerCard>

          {/* Layer 5: Shariah (15 pts) */}
          <LayerCard title="Layer 5 — Shariah Governance"
            subtitle="Advisor (5pts), Policy (3pts), Zakat governance (3pts), Waqf governance (4pts).">
            <CriterionRow name="l5_advisor" label="Named Shariah advisor" hint="5 pts" />
            <CriterionRow name="l5_policy"  label="Written Shariah compliance policy" hint="3 pts" />
            <CriterionRow name="l5_zakat_gov"
              label="Zakat eligibility governance"
              hint={`3 pts${!hasZakat ? ' — mark N/A if non-zakat org' : ''}`}
              includeNa={!hasZakat} />
            <CriterionRow name="l5_waqf_gov"
              label="Waqf asset governance"
              hint={`4 pts${!hasWaqf ? ' — mark N/A if non-waqf org' : ''}`}
              includeNa={!hasWaqf} />
          </LayerCard>

          {/* Notes */}
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Reviewer notes (internal)
            </label>
            <textarea id="notes" name="notes" rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                         focus:ring-emerald-500"
              placeholder="Any observations, rationale, or caveats for this evaluation…" />
          </div>

          <button type="submit" disabled={isPending}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white
                       bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors">
            {isPending ? 'Computing score…' : 'Compute CTCF score →'}
          </button>
        </form>
      )}

      {/* Score result + decision */}
      {showDecision && state?.success && (
        <div>
          {/* Score card */}
          <div className={`rounded-xl border p-6 mb-6 text-center ${
            (state.score ?? 0) >= 55
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2
                          text-gray-500">
              CTCF Score (ctcf_v1)
            </p>
            <p className={`text-5xl font-bold mb-1 ${
              (state.score ?? 0) >= 55 ? 'text-emerald-700' : 'text-red-600'
            }`}>
              {state.score?.toFixed(1)}
            </p>
            <p className="text-base font-medium text-gray-700">{state.grade}</p>
            <p className="text-xs text-gray-400 mt-1">
              {(state.score ?? 0) >= 55
                ? 'Meets certification threshold (≥55)'
                : 'Does not meet certification threshold (<55)'}
            </p>
          </div>

          {/* Decision form */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Certification decision
            </h2>
            <form action={decFormAction} className="space-y-4">
              <input type="hidden" name="appId"  value={appId} />
              <input type="hidden" name="orgId"  value={orgId} />

              {decState?.error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {decState.error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer
                  ${(state.score ?? 0) >= 55
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-gray-50 text-gray-400 opacity-50'}`}>
                  <input type="radio" name="decision" value="certified"
                    disabled={(state.score ?? 0) < 55} className="h-4 w-4" />
                  <span className="text-sm font-medium">Grant certification</span>
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer
                  border-red-200 bg-red-50 text-red-800">
                  <input type="radio" name="decision" value="not_certified"
                    className="h-4 w-4" />
                  <span className="text-sm font-medium">Do not certify</span>
                </label>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Decision reason (visible to org admin)
                </label>
                <textarea id="reason" name="reason" rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                             shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                             focus:ring-emerald-500"
                  placeholder="Explain the decision clearly for the organization…" />
              </div>

              <button type="submit" disabled={decPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                           bg-gray-900 hover:bg-gray-800 disabled:opacity-60 transition-colors">
                {decPending ? 'Recording decision…' : 'Submit decision'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
