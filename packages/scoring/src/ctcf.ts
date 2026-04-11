// packages/scoring/src/ctcf.ts
// Amanah Governance Platform — CTCF Scoring Engine
//
// ctcf_v2 (current):
//   - Graduated response scale: 'full' | 'partial' | 'no' | 'na'
//   - Org size band stored as evaluation context
//   - Total normalised to 0–100 (raw max = 80)
//   - Layer 2 floor: normalised L2 ≥ 10/20
//   - Certification threshold: ≥ 55
//   - Theory of Change alignment lifted into Layer 4
//
// ctcf_v1 (archived): computeCtcfScore_v1 below — kept for audit reproducibility.
//
// This file is pure TypeScript with no runtime dependencies.
// Safe in Next.js server actions and Supabase Edge Functions.

// =============================================================
// SHARED CONSTANTS
// =============================================================

export const CTCF_GRADES = {
  PLATINUM: { min: 85, label: 'Platinum Amanah' },
  GOLD:     { min: 70, label: 'Gold Amanah' },
  SILVER:   { min: 55, label: 'Silver Amanah' },
  NONE:     { min: 0,  label: 'Not Certified' },
} as const;

export const CERTIFICATION_THRESHOLD = 55;  // applies to 0–100 normalised score
export const LAYER2_MINIMUM          = 10;  // normalised Layer 2 score (out of 20)
export const RAW_MAX_SCORE           = 80;  // L2(20)+L3(25)+L4(20)+L5(15)

// =============================================================
// ctcf_v2 TYPES
// =============================================================

export const CTCF_VERSION = 'ctcf_v2' as const;

/** Reviewer response for each scored criterion. */
export type CtcfResponse = 'full' | 'partial' | 'no' | 'na';

/** Multiplier applied per response type. N/A is excluded from denominator. */
export const RESPONSE_MULTIPLIER: Record<Exclude<CtcfResponse, 'na'>, number> = {
  full:    1.0,
  partial: 0.5,
  no:      0.0,
};

/** Org size band — derived from verified annual receipts. */
export type OrgSizeBand = 'micro' | 'small' | 'medium' | 'large';

// ── Layer 1 ───────────────────────────────────────────────────
// Gate remains pass/fail; no graduation.

export interface CtcfLayer1Input {
  legalRegistration:     boolean;
  governingDocument:     boolean;
  namedBoard:            boolean;
  conflictOfInterest:    boolean;
  bankAccountSeparation: boolean;
  contactAndAddress:     boolean;
}

// ── Layer 2 — Financial Transparency (20 pts) ─────────────────
export interface CtcfLayer2Input {
  annualFinancialStatement: CtcfResponse;       // max 5 pts
  auditEvidence:            CtcfResponse;       // max 5 pts
  programAdminBreakdown:    CtcfResponse;       // max 5 pts
  zakatSegregation:         CtcfResponse;       // max 5 pts; 'na' for non-Zakat orgs
}

// ── Layer 3 — Project Transparency (25 pts) ───────────────────
export interface CtcfLayer3Input {
  budgetVsActual:       CtcfResponse;           // max 5 pts
  geoVerifiedReporting: CtcfResponse;           // max 5 pts; 'na' for non-field orgs
  beforeAfterDocs:      CtcfResponse;           // max 5 pts; 'na' where no baseline exists
  beneficiaryMetrics:   CtcfResponse;           // max 5 pts
  completionTimeliness: CtcfResponse;           // max 5 pts
}

// ── Layer 4 — Impact & Sustainability (20 pts) ────────────────
export interface CtcfLayer4Input {
  kpiQualityAndToC:    CtcfResponse;            // max 5 pts — upgraded from hasKpisDefined
  sustainabilityPlan:  CtcfResponse;            // max 5 pts
  continuityTracking:  CtcfResponse;            // max 5 pts
  impactPerCostMetric: CtcfResponse;            // max 5 pts
}

// ── Layer 5 — Shariah Governance (15 pts) ────────────────────
export interface CtcfLayer5Input {
  shariahAdvisor:     CtcfResponse;             // max 5 pts
  shariahPolicy:      CtcfResponse;             // max 3 pts
  zakatEligibilityGov: CtcfResponse;            // max 3 pts; 'na' if non-Zakat
  waqfAssetGovernance: CtcfResponse;            // max 4 pts; 'na' if non-Waqf
}

// ── Top-level input ───────────────────────────────────────────
export interface CtcfInput {
  sizeBand: OrgSizeBand;
  layer1:   CtcfLayer1Input;
  layer2:   CtcfLayer2Input;
  layer3:   CtcfLayer3Input;
  layer4:   CtcfLayer4Input;
  layer5:   CtcfLayer5Input;
}

// ── Result types ──────────────────────────────────────────────
export interface CtcfLayerResult {
  earned:     number;  // raw points earned (before normalisation)
  max:        number;  // max applicable points (after excluding N/A)
  normalized: number;  // scaled to layer_max
  notes:      string;
}

export interface CtcfResult {
  version:               typeof CTCF_VERSION;
  size_band:             OrgSizeBand;
  layer1_gate:           { passed: boolean; failed_items: string[]; notes: string };
  layer2_financial:      CtcfLayerResult;
  layer3_project:        CtcfLayerResult;
  layer4_impact:         CtcfLayerResult;
  layer5_shariah:        CtcfLayerResult;
  raw_total:             number;   // sum of normalised layer scores (out of 80)
  total_score:           number;   // normalised to 0–100
  grade:                 string;
  is_certifiable:        boolean;
  layer2_passes_minimum: boolean;
  breakdown:             Record<string, unknown>;
}

// =============================================================
// ctcf_v2 ENGINE
// =============================================================

export function computeCtcfScore(input: CtcfInput): CtcfResult {

  // ── Layer 1: Gate ─────────────────────────────────────────
  const l1 = input.layer1;
  const gateItems = [
    { name: 'Legal registration',      passed: l1.legalRegistration },
    { name: 'Governing document',      passed: l1.governingDocument },
    { name: 'Named board',             passed: l1.namedBoard },
    { name: 'Conflict of interest',    passed: l1.conflictOfInterest },
    { name: 'Bank account separation', passed: l1.bankAccountSeparation },
    { name: 'Contact & address',       passed: l1.contactAndAddress },
  ];
  const failedItems = gateItems.filter((i) => !i.passed).map((i) => i.name);
  const gatePassed  = failedItems.length === 0;

  const layer1Gate = {
    passed:       gatePassed,
    failed_items: failedItems,
    notes: gatePassed
      ? 'All governance gate criteria met.'
      : `Gate failed. Missing: ${failedItems.join(', ')}.`,
  };

  if (!gatePassed) {
    const zero: CtcfLayerResult = { earned: 0, max: 0, normalized: 0, notes: 'Gate failed.' };
    return {
      version:               CTCF_VERSION,
      size_band:             input.sizeBand,
      layer1_gate:           layer1Gate,
      layer2_financial:      zero,
      layer3_project:        zero,
      layer4_impact:         zero,
      layer5_shariah:        zero,
      raw_total:             0,
      total_score:           0,
      grade:                 CTCF_GRADES.NONE.label,
      is_certifiable:        false,
      layer2_passes_minimum: false,
      breakdown:             buildBreakdown(layer1Gate, zero, zero, zero, zero, 0, 0),
    };
  }

  // ── Layer 2: Financial Transparency (max 20 pts) ──────────
  const l2 = input.layer2;
  const l2Items: Array<{ resp: CtcfResponse; max: number; label: string }> = [
    { resp: l2.annualFinancialStatement, max: 5, label: 'Annual financial statement' },
    { resp: l2.auditEvidence,            max: 5, label: 'Audit evidence' },
    { resp: l2.programAdminBreakdown,    max: 5, label: 'Programme/admin breakdown' },
    { resp: l2.zakatSegregation,         max: 5, label: 'Zakat segregation' },
  ];
  const layer2 = scoreLayer(l2Items, 20);

  // ── Layer 3: Project Transparency (max 25 pts) ────────────
  const l3 = input.layer3;
  const l3Items: Array<{ resp: CtcfResponse; max: number; label: string }> = [
    { resp: l3.budgetVsActual,       max: 5, label: 'Budget vs actuals' },
    { resp: l3.geoVerifiedReporting, max: 5, label: 'Geo-verified reporting' },
    { resp: l3.beforeAfterDocs,      max: 5, label: 'Before/after documentation' },
    { resp: l3.beneficiaryMetrics,   max: 5, label: 'Beneficiary impact metrics' },
    { resp: l3.completionTimeliness, max: 5, label: 'Completion report timeliness' },
  ];
  const layer3 = scoreLayer(l3Items, 25);

  // ── Layer 4: Impact & Sustainability (max 20 pts) ─────────
  const l4 = input.layer4;
  const l4Items: Array<{ resp: CtcfResponse; max: number; label: string }> = [
    { resp: l4.kpiQualityAndToC,    max: 5, label: 'KPI quality & Theory of Change' },
    { resp: l4.sustainabilityPlan,  max: 5, label: 'Sustainability/maintenance plan' },
    { resp: l4.continuityTracking,  max: 5, label: 'Jariah continuity tracking' },
    { resp: l4.impactPerCostMetric, max: 5, label: 'Impact-per-cost metric' },
  ];
  const layer4 = scoreLayer(l4Items, 20);

  // ── Layer 5: Shariah Governance (max 15 pts) ──────────────
  const l5 = input.layer5;
  const l5Items: Array<{ resp: CtcfResponse; max: number; label: string }> = [
    { resp: l5.shariahAdvisor,      max: 5, label: 'Named Shariah advisor' },
    { resp: l5.shariahPolicy,       max: 3, label: 'Written Shariah compliance policy' },
    { resp: l5.zakatEligibilityGov, max: 3, label: 'Zakat eligibility governance' },
    { resp: l5.waqfAssetGovernance, max: 4, label: 'Waqf asset governance' },
  ];
  const layer5 = scoreLayer(l5Items, 15);

  // ── Totals ────────────────────────────────────────────────
  const rawTotal = parseFloat(
    (layer2.normalized + layer3.normalized + layer4.normalized + layer5.normalized)
      .toFixed(2)
  );

  // Normalise raw total (max 80) to 0–100
  const totalScore = parseFloat(((rawTotal / RAW_MAX_SCORE) * 100).toFixed(2));

  // ── Grade ─────────────────────────────────────────────────
  const grade =
    totalScore >= CTCF_GRADES.PLATINUM.min ? CTCF_GRADES.PLATINUM.label :
    totalScore >= CTCF_GRADES.GOLD.min     ? CTCF_GRADES.GOLD.label :
    totalScore >= CTCF_GRADES.SILVER.min   ? CTCF_GRADES.SILVER.label :
                                             CTCF_GRADES.NONE.label;

  const layer2PassesMinimum = layer2.normalized >= LAYER2_MINIMUM;
  const isCertifiable       = totalScore >= CERTIFICATION_THRESHOLD && layer2PassesMinimum;

  return {
    version:               CTCF_VERSION,
    size_band:             input.sizeBand,
    layer1_gate:           layer1Gate,
    layer2_financial:      layer2,
    layer3_project:        layer3,
    layer4_impact:         layer4,
    layer5_shariah:        layer5,
    raw_total:             rawTotal,
    total_score:           totalScore,
    grade,
    is_certifiable:        isCertifiable,
    layer2_passes_minimum: layer2PassesMinimum,
    breakdown:             buildBreakdown(layer1Gate, layer2, layer3, layer4, layer5, rawTotal, totalScore),
  };
}

// =============================================================
// INTERNAL HELPERS
// =============================================================

/** Score a single criterion. Returns earned points (0 if N/A). */
function scoreResponse(resp: CtcfResponse, maxPts: number): number {
  if (resp === 'na') return 0;
  return maxPts * RESPONSE_MULTIPLIER[resp];
}

interface CriterionItem {
  resp:  CtcfResponse;
  max:   number;
  label: string;
}

/**
 * Score a layer given its criteria items and the layer's maximum points.
 * N/A items are excluded from both earned and max totals, then result
 * is normalised back to the full layer_max.
 */
function scoreLayer(items: CriterionItem[], layerMax: number): CtcfLayerResult {
  let earned      = 0;
  let maxApplicable = 0;
  const notes: string[] = [];

  for (const item of items) {
    if (item.resp === 'na') {
      notes.push(`${item.label}: N/A`);
      continue;
    }
    maxApplicable += item.max;
    const pts = scoreResponse(item.resp, item.max);
    earned    += pts;
    if (item.resp === 'partial') notes.push(`${item.label}: Partial (${pts}/${item.max})`);
    if (item.resp === 'no')      notes.push(`${item.label}: Not met`);
  }

  // If all criteria are N/A, award full layer score (not penalised)
  if (maxApplicable === 0) {
    return {
      earned:     layerMax,
      max:        layerMax,
      normalized: layerMax,
      notes:      'All criteria N/A — full layer score awarded.',
    };
  }

  const normalized = parseFloat(((earned / maxApplicable) * layerMax).toFixed(2));

  return {
    earned:     parseFloat(earned.toFixed(2)),
    max:        maxApplicable,
    normalized,
    notes:      notes.length > 0 ? notes.join('; ') : 'All criteria fully met.',
  };
}

function buildBreakdown(
  layer1:    { passed: boolean; failed_items: string[]; notes: string },
  layer2:    CtcfLayerResult,
  layer3:    CtcfLayerResult,
  layer4:    CtcfLayerResult,
  layer5:    CtcfLayerResult,
  rawTotal:  number,
  totalScore: number,
): Record<string, unknown> {
  return {
    layer1_gate:      layer1,
    layer2_financial: layer2,
    layer3_project:   layer3,
    layer4_impact:    layer4,
    layer5_shariah:   layer5,
    raw_total:        rawTotal,
    normalized_total: totalScore,
  };
}

// ── Grade helper (reusable in UI) ─────────────────────────────
export function ctcfGradeInfo(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Platinum Amanah', color: 'text-purple-700' };
  if (score >= 70) return { label: 'Gold Amanah',     color: 'text-amber-600' };
  if (score >= 55) return { label: 'Silver Amanah',   color: 'text-gray-600' };
  return               { label: 'Not Certified',       color: 'text-red-600' };
}

// =============================================================
// ctcf_v1 ARCHIVE — kept for audit trail reproducibility
// Do NOT use for new evaluations.
// =============================================================

export const CTCF_VERSION_V1 = 'ctcf_v1' as const;
export const LAYER2_MINIMUM_V1 = 12;

export interface CtcfInputV1 {
  layer1: {
    hasLegalRegistration:     boolean;
    hasGoverningDocument:     boolean;
    hasNamedBoard:            boolean;
    hasConflictOfInterest:    boolean;
    hasBankAccountSeparation: boolean;
    hasContactAndAddress:     boolean;
  };
  layer2: {
    hasAnnualFinancialStatement: boolean;
    hasAuditEvidence:            boolean;
    hasProgramAdminBreakdown:    boolean;
    hasZakatSegregation:         boolean | null;
  };
  layer3: {
    hasBudgetVsActual:       boolean;
    hasGeoVerifiedReporting: boolean;
    hasBeforeAfterDocs:      boolean;
    hasBeneficiaryMetrics:   boolean;
    hasCompletionTimeliness: boolean;
  };
  layer4: {
    hasKpisDefined:         boolean;
    hasSustainabilityPlan:  boolean;
    hasContinuityTracking:  boolean;
    hasImpactPerCostMetric: boolean;
  };
  layer5: {
    hasShariahAdvisor:      boolean;
    hasShariahPolicy:       boolean;
    hasZakatEligibilityGov: boolean | null;
    hasWaqfAssetGovernance: boolean | null;
  };
}

function normalizeV1(earned: number, maxApplicable: number, layerMax: number): number {
  if (maxApplicable === 0) return layerMax;
  return parseFloat(((earned / maxApplicable) * layerMax).toFixed(2));
}

/** @deprecated Use computeCtcfScore (v2). Retained for audit reproducibility only. */
export function computeCtcfScore_v1(input: CtcfInputV1) {
  const l1 = input.layer1;
  const l1Items = [
    { name: 'Legal registration',      passed: l1.hasLegalRegistration },
    { name: 'Governing document',      passed: l1.hasGoverningDocument },
    { name: 'Named board',             passed: l1.hasNamedBoard },
    { name: 'Conflict of interest',    passed: l1.hasConflictOfInterest },
    { name: 'Bank account separation', passed: l1.hasBankAccountSeparation },
    { name: 'Contact & address',       passed: l1.hasContactAndAddress },
  ];
  const l1Failed = l1Items.filter((i) => !i.passed).map((i) => i.name);
  const l1Passed = l1Failed.length === 0;
  const layer1Gate = {
    passed: l1Passed,
    notes:  l1Passed ? 'All gate criteria met.' : `Failed: ${l1Failed.join(', ')}`,
  };

  if (!l1Passed) {
    return { version: CTCF_VERSION_V1, layer1_gate: layer1Gate,
      layer2_financial: { earned: 0, max: 20, normalized: 0, notes: 'Gate failed.' },
      layer3_project:   { earned: 0, max: 25, normalized: 0, notes: 'Gate failed.' },
      layer4_impact:    { earned: 0, max: 20, normalized: 0, notes: 'Gate failed.' },
      layer5_shariah:   { earned: 0, max: 15, normalized: 0, notes: 'Gate failed.' },
      total_score: 0, grade: CTCF_GRADES.NONE.label, is_certifiable: false,
      layer2_passes_minimum: false, breakdown: {} };
  }

  const l2 = input.layer2;
  const l2Earned = (l2.hasAnnualFinancialStatement ? 5 : 0)
    + (l2.hasAuditEvidence ? 5 : 0)
    + (l2.hasProgramAdminBreakdown ? 5 : 0)
    + (l2.hasZakatSegregation === null ? 0 : l2.hasZakatSegregation ? 5 : 0);
  const l2Max = l2.hasZakatSegregation === null ? 15 : 20;
  const l2Norm = normalizeV1(l2Earned, l2Max, 20);

  const l3 = input.layer3;
  const l3Earned = (l3.hasBudgetVsActual ? 5 : 0) + (l3.hasGeoVerifiedReporting ? 5 : 0)
    + (l3.hasBeforeAfterDocs ? 5 : 0) + (l3.hasBeneficiaryMetrics ? 5 : 0)
    + (l3.hasCompletionTimeliness ? 5 : 0);

  const l4 = input.layer4;
  const l4Earned = (l4.hasKpisDefined ? 5 : 0) + (l4.hasSustainabilityPlan ? 5 : 0)
    + (l4.hasContinuityTracking ? 5 : 0) + (l4.hasImpactPerCostMetric ? 5 : 0);

  const l5 = input.layer5;
  const l5Earned = (l5.hasShariahAdvisor ? 5 : 0) + (l5.hasShariahPolicy ? 3 : 0)
    + (l5.hasZakatEligibilityGov === null ? 0 : l5.hasZakatEligibilityGov ? 3 : 0)
    + (l5.hasWaqfAssetGovernance === null ? 0 : l5.hasWaqfAssetGovernance ? 4 : 0);
  const l5Max = 8
    + (l5.hasZakatEligibilityGov !== null ? 3 : 0)
    + (l5.hasWaqfAssetGovernance !== null ? 4 : 0);
  const l5Norm = normalizeV1(l5Earned, l5Max, 15);

  const totalScore = parseFloat((l2Norm + l3Earned + l4Earned + l5Norm).toFixed(2));
  const grade = totalScore >= 85 ? CTCF_GRADES.PLATINUM.label
    : totalScore >= 70 ? CTCF_GRADES.GOLD.label
    : totalScore >= 55 ? CTCF_GRADES.SILVER.label
    : CTCF_GRADES.NONE.label;
  const l2PassesMin = l2Norm >= LAYER2_MINIMUM_V1;

  return {
    version: CTCF_VERSION_V1,
    layer1_gate: layer1Gate,
    layer2_financial: { earned: l2Earned, max: l2Max, normalized: l2Norm, notes: '' },
    layer3_project:   { earned: l3Earned, max: 25,    normalized: l3Earned, notes: '' },
    layer4_impact:    { earned: l4Earned, max: 20,    normalized: l4Earned, notes: '' },
    layer5_shariah:   { earned: l5Earned, max: l5Max, normalized: l5Norm, notes: '' },
    total_score: totalScore,
    grade,
    is_certifiable: totalScore >= 55 && l2PassesMin,
    layer2_passes_minimum: l2PassesMin,
    breakdown: {},
  };
}
