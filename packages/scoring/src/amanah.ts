// packages/scoring/src/amanah.ts
// Amanah Governance Platform — Amanah Index™ Scoring Engine (amanah_v1)
//
// Implements Doc09_Amanah_Index_Spec_Phase1.md exactly.
//
// Formula (amanah_v1):
//   0.30 × Governance Score
//   0.25 × Financial Transparency Score
//   0.20 × Project Transparency Score
//   0.15 × Impact Efficiency Score
//   0.10 × Feedback Score
//
// Each component is 0–100. Weighted sum gives final 0–100 score.
// Score is append-only — never overwrites previous entries.

export const AMANAH_VERSION = 'amanah_v1' as const;

export const AMANAH_WEIGHTS = {
  governance:           0.30,
  financial_transparency: 0.25,
  project_transparency: 0.20,
  impact_efficiency:    0.15,
  feedback:             0.10,
} as const;

// ── Input: derived from org's current data snapshot ──────────

export interface AmanahInput {
  organizationId: string;

  // Governance (0–100) — driven by onboarding + CTCF layer1
  // 100 = approved + listed + all gate criteria
  // 60  = approved, no CTCF yet
  // 0   = not approved
  governanceScore: number;

  // Financial Transparency (0–100)
  // Driven by financial_snapshots verification status
  // 100 = verified financial snapshot this year
  // 60  = submitted, not yet verified
  // 0   = no financial submission
  financialTransparencyScore: number;

  // Project Transparency (0–100)
  // Driven by verified reports count + recency
  projectTransparencyScore: number;

  // Impact Efficiency (0–100)
  // Driven by beneficiary data and spend metrics in reports
  impactEfficiencyScore: number;

  // Feedback (0–100)
  // Driven by complaints logged/resolved ratio
  // Phase 1 default = 70 (no complaints system yet)
  feedbackScore: number;

  // Trigger context — for public summary
  triggerEvent: string;
}

// ── Output ────────────────────────────────────────────────────

export interface AmanahResult {
  version:    typeof AMANAH_VERSION;
  score:      number; // 0–100, 2dp
  breakdown:  AmanahBreakdown;
  publicSummary: string;
}

export interface AmanahBreakdown {
  governance_score:             number;
  financial_transparency_score: number;
  project_transparency_score:   number;
  impact_efficiency_score:      number;
  feedback_score:               number;
  weights:                      typeof AMANAH_WEIGHTS;
  weighted_contributions: {
    governance:           number;
    financial:            number;
    project:              number;
    impact:               number;
    feedback:             number;
  };
}

// =============================================================
// SCORING ENGINE
// =============================================================

export function computeAmanahScore(input: AmanahInput): AmanahResult {
  const g  = clamp(input.governanceScore,           0, 100);
  const f  = clamp(input.financialTransparencyScore, 0, 100);
  const p  = clamp(input.projectTransparencyScore,   0, 100);
  const im = clamp(input.impactEfficiencyScore,      0, 100);
  const fb = clamp(input.feedbackScore,              0, 100);

  const wg  = AMANAH_WEIGHTS.governance;
  const wf  = AMANAH_WEIGHTS.financial_transparency;
  const wp  = AMANAH_WEIGHTS.project_transparency;
  const wim = AMANAH_WEIGHTS.impact_efficiency;
  const wfb = AMANAH_WEIGHTS.feedback;

  const score = parseFloat(
    (g * wg + f * wf + p * wp + im * wim + fb * wfb).toFixed(2)
  );

  const breakdown: AmanahBreakdown = {
    governance_score:             g,
    financial_transparency_score: f,
    project_transparency_score:   p,
    impact_efficiency_score:      im,
    feedback_score:               fb,
    weights: AMANAH_WEIGHTS,
    weighted_contributions: {
      governance: parseFloat((g * wg).toFixed(2)),
      financial:  parseFloat((f * wf).toFixed(2)),
      project:    parseFloat((p * wp).toFixed(2)),
      impact:     parseFloat((im * wim).toFixed(2)),
      feedback:   parseFloat((fb * wfb).toFixed(2)),
    },
  };

  return {
    version:       AMANAH_VERSION,
    score,
    breakdown,
    publicSummary: buildPublicSummary(input.triggerEvent, score, breakdown),
  };
}

// =============================================================
// COMPONENT SCORE HELPERS
// Called by the recalculation function to derive each component
// =============================================================

/**
 * Governance Score — derived from org status and CTCF gate.
 * 100 = approved + listed + all CTCF gate items passed
 * 80  = approved + listed
 * 60  = approved, not listed
 * 30  = submitted, under review
 * 0   = draft
 */
export function computeGovernanceScore(params: {
  onboardingStatus: string;
  listingStatus:    string;
  ctcfGatePassed:   boolean;
}): number {
  if (params.onboardingStatus !== 'approved') {
    return params.onboarding_status === 'submitted' ? 30 : 0;
  }
  if (params.listingStatus !== 'listed') return 60;
  return params.ctcfGatePassed ? 100 : 80;
}

/**
 * Financial Transparency Score — from financial_snapshots.
 * 100 = verified snapshot < 18 months old
 * 70  = verified snapshot > 18 months old
 * 50  = submitted, not verified
 * 0   = no submission
 */
export function computeFinancialScore(params: {
  verificationStatus: string | null;
  verifiedAt:         string | null;
}): number {
  if (!params.verificationStatus) return 0;
  if (params.verificationStatus === 'verified' && params.verifiedAt) {
    const monthsAgo = monthsSince(params.verifiedAt);
    return monthsAgo <= 18 ? 100 : 70;
  }
  if (params.verificationStatus === 'submitted') return 50;
  return 0;
}

/**
 * Project Transparency Score — from verified reports.
 * 100 = 3+ verified reports, most recent < 90 days
 * 80  = 2 verified reports OR 1 recent
 * 60  = 1 verified report, older
 * 30  = project exists, no verified reports
 * 0   = no projects
 */
export function computeProjectScore(params: {
  verifiedReportCount: number;
  mostRecentVerifiedAt: string | null;
}): number {
  if (params.verifiedReportCount === 0) return params.verifiedReportCount === 0 ? 0 : 30;
  if (!params.mostRecentVerifiedAt)     return 30;

  const daysSince = Math.floor(
    (Date.now() - new Date(params.mostRecentVerifiedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (params.verifiedReportCount >= 3 && daysSince <= 90) return 100;
  if (params.verifiedReportCount >= 2 || daysSince <= 90)  return 80;
  return 60;
}

/**
 * Impact Efficiency Score — from report body fields.
 * Checks: beneficiary data present, spend data present, KPI targets set
 * 100 = all three, spend per beneficiary is reasonable
 * 70  = two of three
 * 40  = one of three
 * 0   = no data
 */
export function computeImpactScore(params: {
  hasBeneficiaryData: boolean;
  hasSpendData:       boolean;
  hasKpiTargets:      boolean;
}): number {
  const count = [params.hasBeneficiaryData, params.hasSpendData, params.hasKpiTargets]
    .filter(Boolean).length;
  if (count === 3) return 100;
  if (count === 2) return 70;
  if (count === 1) return 40;
  return 0;
}

/**
 * Feedback Score — Phase 1 baseline.
 * No complaint system yet → default 70 for all approved orgs.
 * Post-Phase 1: will be computed from complaint_logged/resolved ratios.
 */
export function computeFeedbackScore(params: {
  complaintsLogged:   number;
  complaintsResolved: number;
}): number {
  if (params.complaintsLogged === 0) return 70; // No complaints = neutral baseline
  const resolutionRate = params.complaintsResolved / params.complaintsLogged;
  if (resolutionRate >= 0.9) return 70;
  if (resolutionRate >= 0.7) return 50;
  if (resolutionRate >= 0.5) return 30;
  return 10;
}

// ── Helpers ───────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function monthsSince(isoDate: string): number {
  return Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
}

function buildPublicSummary(
  trigger: string,
  score:   number,
  breakdown: AmanahBreakdown
): string {
  const triggerMessages: Record<string, string> = {
    report_verified:       'Verified progress report added.',
    financial_verified:    'Financial snapshot verified.',
    financial_submitted:   'Financial snapshot submitted for review.',
    certification_updated: 'Certification status updated.',
    donation_confirmed:    'Donation confirmed via payment gateway.',
    manual_recalc:         'Score manually recalculated by platform.',
  };

  const triggerMsg = triggerMessages[trigger] ?? 'Trust score updated.';

  if (score >= 85) return `${triggerMsg} Platinum Amanah grade maintained.`;
  if (score >= 70) return `${triggerMsg} Gold Amanah grade maintained.`;
  if (score >= 55) return `${triggerMsg} Silver Amanah grade maintained.`;
  return `${triggerMsg} Organization is building its trust profile.`;
}
