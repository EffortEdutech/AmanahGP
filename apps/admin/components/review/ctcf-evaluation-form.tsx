'use client';
// apps/admin/components/review/ctcf-evaluation-form.tsx
// AmanahHub Console — CTCF v2 evaluation form
//
// Response scale: Full / Partial / No / N/A (where applicable)
// Added: size band selector at top of form
// Updated: Layer 4 criterion label (KPI Quality + Theory of Change)
// Updated: layer descriptions and per-criterion hints

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { certificationDecision } from '@/app/(dashboard)/review/certification-actions';

interface Props {
  appId:    string;
  orgId:    string;
  orgName:  string;
  hasZakat: boolean;
  hasWaqf:  boolean;
  // Pre-populated from verified Financial Snapshot if available
  initialSizeBand?: 'micro' | 'small' | 'medium' | 'large';
  action:   (prev: any, fd: FormData) => Promise<{
    error?: string; success?: boolean; score?: number; grade?: string;
  }>;
}

const initial = { error: undefined, success: false, score: undefined, grade: undefined };

type SizeBand = 'micro' | 'small' | 'medium' | 'large';

// =============================================================
// SIZE BAND SELECTOR
// State is lifted to parent so criterion hints stay in sync.
// =============================================================
function SizeBandSelector({
  value,
  onChange,
}: {
  value:    SizeBand;
  onChange: (v: SizeBand) => void;
}) {
  const bands: Array<{ value: SizeBand; label: string; sub: string }> = [
    { value: 'micro',  label: 'Micro',  sub: '< RM 100K' },
    { value: 'small',  label: 'Small',  sub: 'RM 100K – 499K' },
    { value: 'medium', label: 'Medium', sub: 'RM 500K – 1.9M' },
    { value: 'large',  label: 'Large',  sub: '≥ RM 2M' },
  ];

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 mb-4">
      <p className="text-sm font-semibold text-amber-800 mb-1">
        Organisation size band
      </p>
      <p className="text-xs text-amber-600 mb-3">
        Determines audit thresholds for Layer 2 criteria 2.1 and 2.2.
        Pre-populated from verified Financial Snapshot where available.
        Override if necessary.
      </p>
      <input type="hidden" name="sizeBand" value={value} />
      <div className="flex flex-wrap gap-2">
        {bands.map((b) => (
          <button
            key={b.value}
            type="button"
            onClick={() => onChange(b.value)}
            className={`px-4 py-2 rounded-md text-xs font-medium border transition-colors ${
              value === b.value
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'
            }`}
          >
            {b.label}
            <span className="block text-[10px] font-normal opacity-80">{b.sub}</span>
          </button>
        ))}
      </div>
      {(value === 'micro' || value === 'small') && (
        <p className="mt-2 text-xs text-amber-600">
          Micro/Small: credible internal financial review acceptable for full Layer 2 credit.
        </p>
      )}
      {(value === 'medium' || value === 'large') && (
        <p className="mt-2 text-xs text-amber-600">
          Medium/Large: external audit by registered accountant required for full Layer 2 credit.
        </p>
      )}
    </div>
  );
}

// =============================================================
// CRITERION ROW — Full / Partial / No / N/A
// =============================================================
function CriterionRow({
  name,
  label,
  hint,
  includeNa = false,
}: {
  name:       string;
  label:      string;
  hint?:      string;
  includeNa?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <label className="flex flex-col items-center gap-0.5 cursor-pointer">
          <input
            type="radio" name={name} value="full" required
            className="accent-emerald-600 h-3.5 w-3.5"
          />
          <span className="text-[10px] text-emerald-700 font-medium">Full</span>
        </label>
        <label className="flex flex-col items-center gap-0.5 cursor-pointer">
          <input
            type="radio" name={name} value="partial"
            className="accent-amber-500 h-3.5 w-3.5"
          />
          <span className="text-[10px] text-amber-600 font-medium">Partial</span>
        </label>
        <label className="flex flex-col items-center gap-0.5 cursor-pointer">
          <input
            type="radio" name={name} value="no"
            className="accent-red-500 h-3.5 w-3.5"
          />
          <span className="text-[10px] text-red-600 font-medium">No</span>
        </label>
        {includeNa && (
          <label className="flex flex-col items-center gap-0.5 cursor-pointer">
            <input
              type="radio" name={name} value="na"
              className="accent-gray-400 h-3.5 w-3.5"
            />
            <span className="text-[10px] text-gray-400 font-medium">N/A</span>
          </label>
        )}
      </div>
    </div>
  );
}

// Layer 1 gate uses a separate Yes / No row (no Partial — gate is binary)
function GateCriterionRow({ name, label }: { name: string; label: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <p className="flex-1 text-sm text-gray-800">{label}</p>
      <div className="flex items-center gap-3 flex-shrink-0">
        <label className="flex flex-col items-center gap-0.5 cursor-pointer">
          <input type="radio" name={name} value="true" required className="accent-emerald-600 h-3.5 w-3.5" />
          <span className="text-[10px] text-emerald-700 font-medium">Yes</span>
        </label>
        <label className="flex flex-col items-center gap-0.5 cursor-pointer">
          <input type="radio" name={name} value="false" className="accent-red-500 h-3.5 w-3.5" />
          <span className="text-[10px] text-red-600 font-medium">No</span>
        </label>
      </div>
    </div>
  );
}

// =============================================================
// LAYER CARD
// =============================================================
function LayerCard({
  title,
  subtitle,
  children,
}: {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
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

// =============================================================
// RESPONSE LEGEND
// =============================================================
function ResponseLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs mb-4 px-1">
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-emerald-700 font-medium">Full</span>
        <span className="text-gray-400">— documented evidence, fully met</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
        <span className="text-amber-600 font-medium">Partial</span>
        <span className="text-gray-400">— partially met, informal, or stale evidence</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
        <span className="text-red-600 font-medium">No</span>
        <span className="text-gray-400">— not met or no evidence</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
        <span className="text-gray-400 font-medium">N/A</span>
        <span className="text-gray-400">— criterion genuinely not applicable</span>
      </span>
    </div>
  );
}

// =============================================================
// GRADE BADGE
// =============================================================
function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const cfg =
    grade === 'Platinum Amanah' ? { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' } :
    grade === 'Gold Amanah'     ? { bg: 'bg-amber-50',  border: 'border-amber-300',  text: 'text-amber-700'  } :
    grade === 'Silver Amanah'   ? { bg: 'bg-gray-50',   border: 'border-gray-300',   text: 'text-gray-600'   } :
                                  { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600'    };
  return (
    <div className={`flex flex-col items-center py-5 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <p className={`text-4xl font-bold ${cfg.text}`}>{score.toFixed(1)}</p>
      <p className={`text-base font-semibold ${cfg.text} mt-1`}>{grade}</p>
      <p className="text-xs text-gray-400 mt-1">Normalised score (0–100)</p>
    </div>
  );
}

// =============================================================
// MAIN FORM COMPONENT
// =============================================================
export function CtcfEvaluationForm({
  appId, orgId, orgName, hasZakat, hasWaqf, initialSizeBand, action,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const [showDecision, setShowDecision] = useState(false);
  const [decState, decFormAction, decPending] = useActionState(certificationDecision, null);
  const [sizeBand, setSizeBand] = useState<SizeBand>(initialSizeBand ?? 'small');
  const router = useRouter();

  useEffect(() => {
    if (state?.success) setShowDecision(true);
  }, [state?.success]);

  useEffect(() => {
    if (decState?.success) router.push('/review/certification');
  }, [decState?.success, router]);

  const isCertifiable = (state.score ?? 0) >= 55;

  const auditHint = (sizeBand === 'medium' || sizeBand === 'large')
    ? 'Medium/Large: Full requires external registered accountant audit.'
    : 'Micro/Small: Full = external accountant. Partial = credible internal review or compilation.';

  const financialStmtHint = (sizeBand === 'medium' || sizeBand === 'large')
    ? 'Medium/Large: Full = externally audited. Partial = internally prepared only.'
    : 'Micro/Small: Full = externally audited or credible internal preparation. Partial = incomplete.';

  return (
    <div>
      {/* ── Evaluation form ─────────────────────────────────── */}
      {!showDecision && (
        <form action={formAction} className="space-y-0">
          <input type="hidden" name="appId" value={appId} />
          <input type="hidden" name="orgId" value={orgId} />

          {state?.error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {/* Size band selector */}
          <SizeBandSelector value={sizeBand} onChange={setSizeBand} />

          {/* Response scale legend */}
          <ResponseLegend />

          {/* ── Layer 1: Gate ──────────────────────────────── */}
          <LayerCard
            title="Layer 1 — Legal & Governance Gate"
            subtitle="All must pass. Fail any single item = Not Certifiable. No partial credit."
          >
            <GateCriterionRow name="l1_legal"     label="Legal identity / registration evidence" />
            <GateCriterionRow name="l1_governing" label="Governing document (constitution / bylaws / deed of trust)" />
            <GateCriterionRow name="l1_board"     label="Named board / committee / trustees (minimum 3, current)" />
            <GateCriterionRow name="l1_coi"       label="Conflict of interest policy (written; board acknowledgement on record)" />
            <GateCriterionRow name="l1_bank"      label="Separate organisational bank account (no personal collection accounts)" />
            <GateCriterionRow name="l1_contact"   label="Physical contact address and at least one active contact point" />
          </LayerCard>

          {/* ── Layer 2: Financial Transparency (20 pts) ───── */}
          <LayerCard
            title="Layer 2 — Financial Transparency"
            subtitle="Max 20 pts. Layer 2 floor: normalised score ≥ 10/20 required for certification."
          >
            <CriterionRow
              name="l2_financial_statement"
              label="2.1  Annual financial statement"
              hint={financialStmtHint}
            />
            <CriterionRow
              name="l2_audit"
              label="2.2  Independent audit evidence"
              hint={auditHint}
            />
            <CriterionRow
              name="l2_breakdown"
              label="2.3  Programme vs administrative cost breakdown"
              hint="Full = formally documented with percentages. Partial = approximate, stated informally."
            />
            <CriterionRow
              name="l2_zakat"
              label="2.4  Zakat fund segregation and traceability"
              hint="Full = dedicated account/sub-ledger with distribution trails. Partial = tracked, commingled."
              includeNa={!hasZakat}
            />
          </LayerCard>

          {/* ── Layer 3: Project Transparency (25 pts) ─────── */}
          <LayerCard
            title="Layer 3 — Project Transparency & Traceability"
            subtitle="Max 25 pts. Mark N/A only where the criterion genuinely does not apply to this org's activities."
          >
            <CriterionRow
              name="l3_budget"
              label="3.1  Budget vs actuals tracking"
              hint="Full = formal budget vs actuals report per project. Partial = informal tracking, not documented."
            />
            <CriterionRow
              name="l3_geo"
              label="3.2  Geo-verified reporting"
              hint="Full = GPS-tagged or third-party verified. Partial = address/district stated, unverified."
              includeNa
            />
            <CriterionRow
              name="l3_before_after"
              label="3.3  Before / after documentation"
              hint="Full = structured before/after with dates and measurable baseline. Partial = post-implementation only."
              includeNa
            />
            <CriterionRow
              name="l3_beneficiary"
              label="3.4  Beneficiary impact metrics with context"
              hint="Full = quantified count + outcome metrics. Partial = headcount only, no outcome metrics."
            />
            <CriterionRow
              name="l3_timeliness"
              label="3.5  Completion report timeliness"
              hint="Full = filed within 30 days of project close. Partial = within 90 days. No = not filed or > 90 days."
            />
          </LayerCard>

          {/* ── Layer 4: Impact & Sustainability (20 pts) ───── */}
          <LayerCard
            title="Layer 4 — Impact & Sustainability"
            subtitle="Max 20 pts."
          >
            <CriterionRow
              name="l4_kpi_toc"
              label="4.1  KPI quality and Theory of Change alignment"
              hint="Full = SMART KPIs + written rationale linking activities to outcomes (logic model / ToC). Partial = KPIs present but not SMART, or no documented causal rationale."
            />
            <CriterionRow
              name="l4_sustainability"
              label="4.2  Sustainability / maintenance plan"
              hint="Full = written plan with assigned responsibilities, timeline, and funding source. Partial = informal / verbal plan only."
            />
            <CriterionRow
              name="l4_continuity"
              label="4.3  Jariah continuity tracking cadence"
              hint="Full = formal tracking schedule with periodic reports. Partial = ad hoc tracking, no schedule."
            />
            <CriterionRow
              name="l4_impact_cost"
              label="4.4  Impact-per-cost efficiency metric"
              hint="Full = cost per beneficiary or cost per outcome documented. Partial = total project cost disclosed, no per-beneficiary breakdown."
            />
          </LayerCard>

          {/* ── Layer 5: Shariah Governance (15 pts) ─────────── */}
          <LayerCard
            title="Layer 5 — Shariah Governance"
            subtitle="Max 15 pts. Cross-reference Scholar Notes before completing this layer."
          >
            <CriterionRow
              name="l5_advisor"
              label="5.1  Named Shariah advisor"
              hint="Full = named external qualified scholar, documented engagement. Partial = internal committee only, or no engagement letter."
            />
            <CriterionRow
              name="l5_policy"
              label="5.2  Written Shariah compliance policy"
              hint="Full = board-approved written policy. Partial = informal policy acknowledged, not documented."
            />
            <CriterionRow
              name="l5_zakat_gov"
              label="5.3  Zakat eligibility governance"
              hint="Full = formal eligibility criteria documented, verification process, per-beneficiary records. Partial = informal screening."
              includeNa={!hasZakat}
            />
            <CriterionRow
              name="l5_waqf_gov"
              label="5.4  Waqf asset governance"
              hint="Full = documented asset register with governance rules, permissible/prohibited uses, reviewed annually. Partial = informal tracking."
              includeNa={!hasWaqf}
            />
          </LayerCard>

          {/* Reviewer notes */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 mb-4">
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1">
              Reviewer notes (internal — not visible to organisation)
            </label>
            <textarea
              id="notes" name="notes" rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                         shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                         focus:ring-emerald-500"
              placeholder="Note any stale evidence, size band overrides, or other evaluation context…"
            />
          </div>

          <button
            type="submit" disabled={isPending}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white
                       bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 transition-colors"
          >
            {isPending ? 'Computing score…' : 'Compute CTCF score'}
          </button>
        </form>
      )}

      {/* ── Score result + decision form ──────────────────────── */}
      {showDecision && (
        <div className="space-y-5">
          {/* Score card */}
          <GradeBadge
            score={state.score ?? 0}
            grade={state.grade ?? 'Not Certified'}
          />

          {/* Threshold indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-md border px-4 py-3 text-center text-xs ${
              isCertifiable
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              <p className="font-semibold">{isCertifiable ? '✓ Meets' : '✗ Below'} threshold</p>
              <p className="opacity-70">Minimum 55 / 100</p>
            </div>
            <div className="rounded-md border px-4 py-3 text-center text-xs bg-gray-50 border-gray-200 text-gray-500">
              <p className="font-medium">Scoring: ctcf_v2</p>
              <p className="opacity-70">Raw max: 80 → normalised to 100</p>
            </div>
          </div>

          {/* Decision form */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Certification decision
            </h2>
            <form action={decFormAction} className="space-y-4">
              <input type="hidden" name="appId" value={appId} />
              <input type="hidden" name="orgId" value={orgId} />

              {decState?.error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {decState.error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer
                  ${isCertifiable
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-gray-50 text-gray-400 opacity-50 pointer-events-none'}`}>
                  <input
                    type="radio" name="decision" value="certified"
                    disabled={!isCertifiable} className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Grant certification</span>
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer
                  border-red-200 bg-red-50 text-red-800">
                  <input type="radio" name="decision" value="not_certified" className="h-4 w-4" />
                  <span className="text-sm font-medium">Do not certify</span>
                </label>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Decision reason (visible to organisation admin)
                </label>
                <textarea
                  id="reason" name="reason" rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                             shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                             focus:ring-emerald-500"
                  placeholder="Explain the decision clearly for the organisation…"
                />
              </div>

              <button
                type="submit" disabled={decPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white
                           bg-gray-900 hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {decPending ? 'Recording decision…' : 'Submit decision'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
