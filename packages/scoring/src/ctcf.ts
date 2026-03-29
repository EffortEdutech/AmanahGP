// packages/scoring/src/ctcf.ts
// Amanah Governance Platform — CTCF Scoring Engine (ctcf_v1)
//
// Implements the Charity Transparency Certification Framework exactly per
// Doc08_CTCF_Criteria_Scoring_Phase1.md
//
// Rules:
//   Layer 1 = Pass/Fail gate. Fail → not certifiable, score = 0.
//   Layers 2–5 = scored criteria, normalized if N/A items excluded.
//   Certification threshold = 55/100
//   Layer 2 minimum = 12/20
//   N/A normalization: (earned / max_applicable) * layer_max
//
// This file is pure TypeScript with no runtime dependencies.
// It can be used in both Next.js server actions and Supabase Edge Functions.

export const CTCF_VERSION = 'ctcf_v1' as const;

// ── Grade thresholds ──────────────────────────────────────────
export const CTCF_GRADES = {
  PLATINUM: { min: 85, label: 'Platinum Amanah' },
  GOLD:     { min: 70, label: 'Gold Amanah' },
  SILVER:   { min: 55, label: 'Silver Amanah' },
  NONE:     { min: 0,  label: 'Not Certified' },
} as const;

export const CERTIFICATION_THRESHOLD = 55;
export const LAYER2_MINIMUM          = 12;

// ── Input types ───────────────────────────────────────────────

export interface CtcfLayer1Input {
  // All must be true to pass the gate
  hasLegalRegistration:      boolean; // Legal identity / registration evidence
  hasGoverningDocument:      boolean; // Constitution / bylaws
  hasNamedBoard:             boolean; // Named board / committee / trustees
  hasConflictOfInterest:     boolean; // Conflict of interest policy
  hasBankAccountSeparation:  boolean; // Org bank account (no personal collection)
  hasContactAndAddress:      boolean; // Clear contact + physical address proof
}

export interface CtcfLayer2Input {
  // 5 pts each; normalized if zakat criteria N/A
  hasAnnualFinancialStatement: boolean; // Financial statement provided
  hasAuditEvidence:            boolean; // External audit or credible equivalent
  hasProgramAdminBreakdown:    boolean; // Program vs admin breakdown disclosed
  hasZakatSegregation:         boolean | null; // null = N/A (non-zakat org)
}

export interface CtcfLayer3Input {
  // 5 pts each
  hasBudgetVsActual:         boolean; // Budget vs actual tracking
  hasGeoVerifiedReporting:   boolean; // Geo-verified or verifiable location marker
  hasBeforeAfterDocs:        boolean; // Before/after documentation
  hasBeneficiaryMetrics:     boolean; // Beneficiary impact metrics with context
  hasCompletionTimeliness:   boolean; // Completion report timeliness
}

export interface CtcfLayer4Input {
  // 5 pts each
  hasKpisDefined:            boolean; // KPIs defined
  hasSustainabilityPlan:     boolean; // Sustainability / maintenance plan
  hasContinuityTracking:     boolean; // Continuity tracking cadence (jariah)
  hasImpactPerCostMetric:    boolean; // Impact-per-cost efficiency metric
}

export interface CtcfLayer5Input {
  // Named Shariah advisor = 5pts
  // Written policy = 3pts
  // Zakat eligibility governance = 3pts (N/A if non-zakat)
  // Waqf asset governance = 4pts (N/A if non-waqf)
  hasShariahAdvisor:         boolean;      // Named Shariah advisor
  hasShariahPolicy:          boolean;      // Written Shariah compliance policy
  hasZakatEligibilityGov:    boolean | null; // null = N/A
  hasWaqfAssetGovernance:    boolean | null; // null = N/A
}

export interface CtcfInput {
  layer1: CtcfLayer1Input;
  layer2: CtcfLayer2Input;
  layer3: CtcfLayer3Input;
  layer4: CtcfLayer4Input;
  layer5: CtcfLayer5Input;
}

// ── Output types ──────────────────────────────────────────────

export interface CtcfLayerResult {
  earned:       number;
  max:          number;
  normalized:   number; // After N/A normalization
  notes:        string;
}

export interface CtcfResult {
  version:          typeof CTCF_VERSION;
  layer1_gate:      { passed: boolean; notes: string };
  layer2_financial: CtcfLayerResult;
  layer3_project:   CtcfLayerResult;
  layer4_impact:    CtcfLayerResult;
  layer5_shariah:   CtcfLayerResult;
  total_score:      number; // 0–100, rounded to 2dp
  grade:            string;
  is_certifiable:   boolean;
  layer2_passes_minimum: boolean;
  breakdown:        Record<string, any>; // For JSONB storage
}

// =============================================================
// SCORING ENGINE
// =============================================================

export function computeCtcfScore(input: CtcfInput): CtcfResult {

  // ── Layer 1: Gate ─────────────────────────────────────────
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
    notes:  l1Passed
      ? 'All governance gate criteria met.'
      : `Failed: ${l1Failed.join(', ')}`,
  };

  // If gate fails, return zeroed result
  if (!l1Passed) {
    return {
      version:               CTCF_VERSION,
      layer1_gate:           layer1Gate,
      layer2_financial:      { earned: 0, max: 20, normalized: 0, notes: 'Gate failed.' },
      layer3_project:        { earned: 0, max: 25, normalized: 0, notes: 'Gate failed.' },
      layer4_impact:         { earned: 0, max: 20, normalized: 0, notes: 'Gate failed.' },
      layer5_shariah:        { earned: 0, max: 15, normalized: 0, notes: 'Gate failed.' },
      total_score:           0,
      grade:                 CTCF_GRADES.NONE.label,
      is_certifiable:        false,
      layer2_passes_minimum: false,
      breakdown:             buildBreakdown(layer1Gate, null, null, null, null, 0),
    };
  }

  // ── Layer 2: Financial Transparency (20 pts, 5 each) ──────
  const l2 = input.layer2;
  const l2Earned =
    (l2.hasAnnualFinancialStatement ? 5 : 0) +
    (l2.hasAuditEvidence            ? 5 : 0) +
    (l2.hasProgramAdminBreakdown    ? 5 : 0) +
    (l2.hasZakatSegregation === null ? 0 :
     l2.hasZakatSegregation         ? 5 : 0);

  const l2MaxApplicable = l2.hasZakatSegregation === null ? 15 : 20;
  const l2Normalized    = normalize(l2Earned, l2MaxApplicable, 20);

  const l2Notes: string[] = [];
  if (!l2.hasAnnualFinancialStatement) l2Notes.push('No financial statement');
  if (!l2.hasAuditEvidence)            l2Notes.push('No audit evidence');
  if (!l2.hasProgramAdminBreakdown)    l2Notes.push('No program/admin breakdown');
  if (l2.hasZakatSegregation === false) l2Notes.push('Zakat segregation missing');
  if (l2.hasZakatSegregation === null) l2Notes.push('Zakat criteria N/A (normalized)');

  const layer2: CtcfLayerResult = {
    earned:     l2Earned,
    max:        l2MaxApplicable,
    normalized: l2Normalized,
    notes:      l2Notes.length > 0 ? l2Notes.join('; ') : 'All financial criteria met.',
  };

  // ── Layer 3: Project Transparency (25 pts, 5 each) ───────
  const l3 = input.layer3;
  const l3Earned =
    (l3.hasBudgetVsActual       ? 5 : 0) +
    (l3.hasGeoVerifiedReporting ? 5 : 0) +
    (l3.hasBeforeAfterDocs      ? 5 : 0) +
    (l3.hasBeneficiaryMetrics   ? 5 : 0) +
    (l3.hasCompletionTimeliness ? 5 : 0);

  const l3Notes: string[] = [];
  if (!l3.hasBudgetVsActual)       l3Notes.push('No budget vs actual tracking');
  if (!l3.hasGeoVerifiedReporting) l3Notes.push('No geo-verified reporting');
  if (!l3.hasBeforeAfterDocs)      l3Notes.push('No before/after documentation');
  if (!l3.hasBeneficiaryMetrics)   l3Notes.push('No beneficiary metrics');
  if (!l3.hasCompletionTimeliness) l3Notes.push('Reports not timely');

  const layer3: CtcfLayerResult = {
    earned:     l3Earned,
    max:        25,
    normalized: l3Earned, // No N/A items in layer 3
    notes:      l3Notes.length > 0 ? l3Notes.join('; ') : 'All project criteria met.',
  };

  // ── Layer 4: Impact & Sustainability (20 pts, 5 each) ─────
  const l4 = input.layer4;
  const l4Earned =
    (l4.hasKpisDefined           ? 5 : 0) +
    (l4.hasSustainabilityPlan    ? 5 : 0) +
    (l4.hasContinuityTracking    ? 5 : 0) +
    (l4.hasImpactPerCostMetric   ? 5 : 0);

  const l4Notes: string[] = [];
  if (!l4.hasKpisDefined)         l4Notes.push('No KPIs defined');
  if (!l4.hasSustainabilityPlan)  l4Notes.push('No sustainability plan');
  if (!l4.hasContinuityTracking)  l4Notes.push('No continuity tracking');
  if (!l4.hasImpactPerCostMetric) l4Notes.push('No impact-per-cost metric');

  const layer4: CtcfLayerResult = {
    earned:     l4Earned,
    max:        20,
    normalized: l4Earned,
    notes:      l4Notes.length > 0 ? l4Notes.join('; ') : 'All impact criteria met.',
  };

  // ── Layer 5: Shariah Governance (15 pts) ─────────────────
  // Advisor=5, Policy=3, Zakat=3 (N/A if non-zakat), Waqf=4 (N/A if non-waqf)
  const l5 = input.layer5;
  const l5Earned =
    (l5.hasShariahAdvisor              ? 5 : 0) +
    (l5.hasShariahPolicy               ? 3 : 0) +
    (l5.hasZakatEligibilityGov === null ? 0 :
     l5.hasZakatEligibilityGov         ? 3 : 0) +
    (l5.hasWaqfAssetGovernance === null ? 0 :
     l5.hasWaqfAssetGovernance         ? 4 : 0);

  const l5MaxApplicable =
    8 + // advisor (5) + policy (3) always applicable
    (l5.hasZakatEligibilityGov !== null ? 3 : 0) +
    (l5.hasWaqfAssetGovernance !== null ? 4 : 0);

  const l5Normalized = normalize(l5Earned, l5MaxApplicable, 15);

  const l5Notes: string[] = [];
  if (!l5.hasShariahAdvisor)              l5Notes.push('No named Shariah advisor');
  if (!l5.hasShariahPolicy)               l5Notes.push('No written Shariah policy');
  if (l5.hasZakatEligibilityGov === false) l5Notes.push('Zakat eligibility governance missing');
  if (l5.hasWaqfAssetGovernance === false) l5Notes.push('Waqf asset governance missing');
  if (l5.hasZakatEligibilityGov === null) l5Notes.push('Zakat governance N/A');
  if (l5.hasWaqfAssetGovernance === null) l5Notes.push('Waqf governance N/A');

  const layer5: CtcfLayerResult = {
    earned:     l5Earned,
    max:        l5MaxApplicable,
    normalized: l5Normalized,
    notes:      l5Notes.length > 0 ? l5Notes.join('; ') : 'All Shariah criteria met.',
  };

  // ── Total score ───────────────────────────────────────────
  const totalScore = parseFloat(
    (layer2.normalized + layer3.normalized + layer4.normalized + layer5.normalized)
      .toFixed(2)
  );

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
    layer1_gate:           layer1Gate,
    layer2_financial:      layer2,
    layer3_project:        layer3,
    layer4_impact:         layer4,
    layer5_shariah:        layer5,
    total_score:           totalScore,
    grade,
    is_certifiable:        isCertifiable,
    layer2_passes_minimum: layer2PassesMinimum,
    breakdown:             buildBreakdown(layer1Gate, layer2, layer3, layer4, layer5, totalScore),
  };
}

// ── Helpers ───────────────────────────────────────────────────

function normalize(earned: number, maxApplicable: number, layerMax: number): number {
  if (maxApplicable === 0) return layerMax; // Fully N/A — treat as full marks
  return parseFloat(((earned / maxApplicable) * layerMax).toFixed(2));
}

function buildBreakdown(
  layer1:  { passed: boolean; notes: string },
  layer2:  CtcfLayerResult | null,
  layer3:  CtcfLayerResult | null,
  layer4:  CtcfLayerResult | null,
  layer5:  CtcfLayerResult | null,
  total:   number
): Record<string, any> {
  return {
    layer1_gate:      layer1,
    layer2_financial: layer2,
    layer3_project:   layer3,
    layer4_impact:    layer4,
    layer5_shariah:   layer5,
    normalized_total: total,
  };
}

// ── Grade helper (reusable in UI) ─────────────────────────────
export function ctcfGradeInfo(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Platinum Amanah', color: 'text-purple-700' };
  if (score >= 70) return { label: 'Gold Amanah',     color: 'text-amber-600' };
  if (score >= 55) return { label: 'Silver Amanah',   color: 'text-gray-600' };
  return               { label: 'Not Certified',       color: 'text-red-600' };
}
