// packages/scoring/src/__tests__/ctcf.test.ts
// Amanah Governance Platform — CTCF scoring engine unit tests

import { describe, it, expect } from 'vitest';
import {
  computeCtcfScore,
  CERTIFICATION_THRESHOLD,
  LAYER2_MINIMUM,
  CTCF_GRADES,
  type CtcfInput,
} from '../ctcf';

// ── Helpers ───────────────────────────────────────────────────

function allTrue(): CtcfInput {
  return {
    layer1: {
      hasLegalRegistration:     true,
      hasGoverningDocument:     true,
      hasNamedBoard:            true,
      hasConflictOfInterest:    true,
      hasBankAccountSeparation: true,
      hasContactAndAddress:     true,
    },
    layer2: {
      hasAnnualFinancialStatement: true,
      hasAuditEvidence:            true,
      hasProgramAdminBreakdown:    true,
      hasZakatSegregation:         true,
    },
    layer3: {
      hasBudgetVsActual:       true,
      hasGeoVerifiedReporting: true,
      hasBeforeAfterDocs:      true,
      hasBeneficiaryMetrics:   true,
      hasCompletionTimeliness: true,
    },
    layer4: {
      hasKpisDefined:         true,
      hasSustainabilityPlan:  true,
      hasContinuityTracking:  true,
      hasImpactPerCostMetric: true,
    },
    layer5: {
      hasShariahAdvisor:      true,
      hasShariahPolicy:       true,
      hasZakatEligibilityGov: true,
      hasWaqfAssetGovernance: true,
    },
  };
}

// =============================================================
// LAYER 1 GATE
// =============================================================
describe('Layer 1 — Gate', () => {
  it('passes when all 6 items are true', () => {
    const result = computeCtcfScore(allTrue());
    expect(result.layer1_gate.passed).toBe(true);
  });

  it('fails when any single item is false', () => {
    const items: (keyof CtcfInput['layer1'])[] = [
      'hasLegalRegistration', 'hasGoverningDocument', 'hasNamedBoard',
      'hasConflictOfInterest', 'hasBankAccountSeparation', 'hasContactAndAddress',
    ];
    for (const item of items) {
      const input = allTrue();
      input.layer1[item] = false;
      const result = computeCtcfScore(input);
      expect(result.layer1_gate.passed).toBe(false);
      expect(result.total_score).toBe(0);
      expect(result.is_certifiable).toBe(false);
    }
  });

  it('returns score 0 on gate failure regardless of other layers', () => {
    const input = allTrue();
    input.layer1.hasLegalRegistration = false;
    const result = computeCtcfScore(input);
    expect(result.total_score).toBe(0);
    expect(result.layer2_financial.normalized).toBe(0);
    expect(result.layer3_project.normalized).toBe(0);
  });

  it('notes include the failed item names', () => {
    const input = allTrue();
    input.layer1.hasConflictOfInterest    = false;
    input.layer1.hasBankAccountSeparation = false;
    const result = computeCtcfScore(input);
    expect(result.layer1_gate.notes).toContain('Conflict of interest');
    expect(result.layer1_gate.notes).toContain('Bank account separation');
  });
});

// =============================================================
// LAYER 2 — Financial Transparency
// =============================================================
describe('Layer 2 — Financial Transparency', () => {
  it('scores 20/20 when all 4 items true (including zakat)', () => {
    const result = computeCtcfScore(allTrue());
    expect(result.layer2_financial.earned).toBe(20);
    expect(result.layer2_financial.normalized).toBe(20);
  });

  it('normalizes correctly when zakat is N/A', () => {
    const input = allTrue();
    input.layer2.hasZakatSegregation = null;
    // 15 earned / 15 max * 20 = 20
    const result = computeCtcfScore(input);
    expect(result.layer2_financial.max).toBe(15);
    expect(result.layer2_financial.normalized).toBe(20);
  });

  it('partial score with zakat N/A normalizes correctly', () => {
    const input = allTrue();
    input.layer2.hasZakatSegregation    = null;
    input.layer2.hasProgramAdminBreakdown = false;
    // 10 earned / 15 max * 20 = 13.33
    const result = computeCtcfScore(input);
    expect(result.layer2_financial.normalized).toBeCloseTo(13.33, 1);
  });

  it('fails layer2 minimum when score < 12', () => {
    const input = allTrue();
    input.layer2.hasAuditEvidence         = false;
    input.layer2.hasProgramAdminBreakdown = false;
    input.layer2.hasZakatSegregation      = false;
    // 5/20 normalized = 5 < 12
    const result = computeCtcfScore(input);
    expect(result.layer2_financial.normalized).toBe(5);
    expect(result.layer2_passes_minimum).toBe(false);
    expect(result.is_certifiable).toBe(false);
  });

  it('layer2 minimum fails when only 1 of 3 applicable items true', () => {
    const input = allTrue();
    input.layer2.hasZakatSegregation      = null;
    input.layer2.hasAuditEvidence         = false;
    input.layer2.hasProgramAdminBreakdown = false;
    // 5/15 * 20 = 6.67 < 12
    const result = computeCtcfScore(input);
    expect(result.layer2_passes_minimum).toBe(false);
  });
});

// =============================================================
// LAYER 3 — Project Transparency
// =============================================================
describe('Layer 3 — Project Transparency', () => {
  it('scores 25 when all 5 items true', () => {
    const result = computeCtcfScore(allTrue());
    expect(result.layer3_project.earned).toBe(25);
    expect(result.layer3_project.normalized).toBe(25);
  });

  it('scores 5 pts per item', () => {
    const input = allTrue();
    input.layer3.hasBudgetVsActual       = false;
    input.layer3.hasGeoVerifiedReporting = false;
    const result = computeCtcfScore(input);
    expect(result.layer3_project.earned).toBe(15);
  });

  it('scores 0 when all false (after gate pass)', () => {
    const input = allTrue();
    input.layer3 = {
      hasBudgetVsActual: false, hasGeoVerifiedReporting: false,
      hasBeforeAfterDocs: false, hasBeneficiaryMetrics: false,
      hasCompletionTimeliness: false,
    };
    const result = computeCtcfScore(input);
    expect(result.layer3_project.earned).toBe(0);
  });
});

// =============================================================
// LAYER 4 — Impact & Sustainability
// =============================================================
describe('Layer 4 — Impact & Sustainability', () => {
  it('scores 20 when all 4 items true', () => {
    const result = computeCtcfScore(allTrue());
    expect(result.layer4_impact.earned).toBe(20);
  });

  it('scores 5 pts per item', () => {
    const input = allTrue();
    input.layer4.hasKpisDefined = false;
    const result = computeCtcfScore(input);
    expect(result.layer4_impact.earned).toBe(15);
  });
});

// =============================================================
// LAYER 5 — Shariah Governance
// =============================================================
describe('Layer 5 — Shariah Governance', () => {
  it('scores 15 when all items applicable and true', () => {
    const result = computeCtcfScore(allTrue());
    expect(result.layer5_shariah.normalized).toBe(15);
  });

  it('normalizes correctly when both zakat and waqf are N/A', () => {
    const input = allTrue();
    input.layer5.hasZakatEligibilityGov = null;
    input.layer5.hasWaqfAssetGovernance = null;
    // max applicable = 8 (advisor 5 + policy 3), earned = 8
    // normalized = 8/8 * 15 = 15
    const result = computeCtcfScore(input);
    expect(result.layer5_shariah.normalized).toBe(15);
  });

  it('deducts advisor points (5pts) when missing', () => {
    const input = allTrue();
    input.layer5.hasShariahAdvisor = false;
    // 10/15 * 15 = 10
    const result = computeCtcfScore(input);
    expect(result.layer5_shariah.normalized).toBe(10);
  });
});

// =============================================================
// TOTAL SCORE AND GRADES
// =============================================================
describe('Total score and grades', () => {
  it('returns 80 for all-true zakat+waqf org', () => {
    // L2:20 + L3:25 + L4:20 + L5:15 = 80
    const result = computeCtcfScore(allTrue());
    expect(result.total_score).toBe(80);
    expect(result.grade).toBe('Gold Amanah');
    expect(result.is_certifiable).toBe(true);
  });

  it('Platinum grade requires ≥85 — all-true zakat+waqf scores 80 (below platinum)', () => {
    const result = computeCtcfScore(allTrue());
    // Max with zakat+waqf all true = 80, which is Gold not Platinum
    expect(result.total_score).toBeLessThan(CTCF_GRADES.PLATINUM.min);
    expect(result.grade).toBe('Gold Amanah');
  });

  it('Silver grade at 55–69 — remove 3 layer3 items (−15 pts → 65)', () => {
    const input = allTrue();
    // Start at 80, remove 3 items from layer3 (3 × 5 = 15 pts)
    // 80 − 15 = 65 → Silver Amanah ✓
    input.layer3.hasBudgetVsActual       = false;
    input.layer3.hasGeoVerifiedReporting = false;
    input.layer3.hasBeforeAfterDocs      = false;
    const result = computeCtcfScore(input);
    expect(result.total_score).toBeGreaterThanOrEqual(55);
    expect(result.total_score).toBeLessThan(70);
    expect(result.grade).toBe('Silver Amanah');
    expect(result.is_certifiable).toBe(true);
  });

  it('Not certified below threshold — zero all layers 2–5', () => {
    const input = allTrue();
    input.layer2 = {
      hasAnnualFinancialStatement: false, hasAuditEvidence: false,
      hasProgramAdminBreakdown: false, hasZakatSegregation: false,
    };
    input.layer3 = {
      hasBudgetVsActual: false, hasGeoVerifiedReporting: false,
      hasBeforeAfterDocs: false, hasBeneficiaryMetrics: false,
      hasCompletionTimeliness: false,
    };
    input.layer4 = {
      hasKpisDefined: false, hasSustainabilityPlan: false,
      hasContinuityTracking: false, hasImpactPerCostMetric: false,
    };
    const result = computeCtcfScore(input);
    expect(result.total_score).toBeLessThan(CERTIFICATION_THRESHOLD);
    expect(result.is_certifiable).toBe(false);
    expect(result.grade).toBe('Not Certified');
  });

  it('is_certifiable requires BOTH threshold AND layer2 minimum', () => {
    const input = allTrue();
    // Force layer2 below minimum (only 1 item true = 5/20 normalized)
    input.layer2.hasAuditEvidence         = false;
    input.layer2.hasProgramAdminBreakdown = false;
    input.layer2.hasZakatSegregation      = false;
    // layer2 = 5 (< 12 minimum) → not certifiable even if total ≥ 55
    const result = computeCtcfScore(input);
    expect(result.layer2_passes_minimum).toBe(false);
    expect(result.is_certifiable).toBe(false);
  });

  it('breakdown is stored for JSONB', () => {
    const result = computeCtcfScore(allTrue());
    expect(result.breakdown).toHaveProperty('layer1_gate');
    expect(result.breakdown).toHaveProperty('layer2_financial');
    expect(result.breakdown).toHaveProperty('normalized_total');
    expect(result.breakdown.normalized_total).toBe(result.total_score);
  });
});
