// packages/scoring/src/__tests__/ctcf.test.ts
// Amanah Governance Platform — CTCF v2 scoring engine unit tests

import { describe, it, expect } from 'vitest';
import {
  computeCtcfScore,
  computeCtcfScore_v1,
  CERTIFICATION_THRESHOLD,
  LAYER2_MINIMUM,
  CTCF_GRADES,
  RAW_MAX_SCORE,
  type CtcfInput,
  type CtcfInputV1,
} from '../ctcf';

// =============================================================
// TEST HELPERS
// =============================================================

/** All criteria full, small size band, Zakat+Waqf applicable. */
function allFull(): CtcfInput {
  return {
    sizeBand: 'small',
    layer1: {
      legalRegistration:     true,
      governingDocument:     true,
      namedBoard:            true,
      conflictOfInterest:    true,
      bankAccountSeparation: true,
      contactAndAddress:     true,
    },
    layer2: {
      annualFinancialStatement: 'full',
      auditEvidence:            'full',
      programAdminBreakdown:    'full',
      zakatSegregation:         'full',
    },
    layer3: {
      budgetVsActual:       'full',
      geoVerifiedReporting: 'full',
      beforeAfterDocs:      'full',
      beneficiaryMetrics:   'full',
      completionTimeliness: 'full',
    },
    layer4: {
      kpiQualityAndToC:    'full',
      sustainabilityPlan:  'full',
      continuityTracking:  'full',
      impactPerCostMetric: 'full',
    },
    layer5: {
      shariahAdvisor:      'full',
      shariahPolicy:       'full',
      zakatEligibilityGov: 'full',
      waqfAssetGovernance: 'full',
    },
  };
}

// =============================================================
// LAYER 1 — GATE
// =============================================================
describe('Layer 1 — Gate', () => {
  it('passes when all 6 items are true', () => {
    expect(computeCtcfScore(allFull()).layer1_gate.passed).toBe(true);
  });

  const gateFields = [
    'legalRegistration', 'governingDocument', 'namedBoard',
    'conflictOfInterest', 'bankAccountSeparation', 'contactAndAddress',
  ] as const;

  for (const field of gateFields) {
    it(`fails and returns zero score when ${field} is false`, () => {
      const input = allFull();
      input.layer1[field] = false;
      const r = computeCtcfScore(input);
      expect(r.layer1_gate.passed).toBe(false);
      expect(r.is_certifiable).toBe(false);
      expect(r.total_score).toBe(0);
      expect(r.layer1_gate.failed_items).toContain(
        field.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, (c) => c.toUpperCase()).trim()
      );
    });
  }
});

// =============================================================
// LAYER 2 — FINANCIAL TRANSPARENCY
// =============================================================
describe('Layer 2 — Financial Transparency', () => {
  it('scores 20/20 when all four criteria are full', () => {
    const r = computeCtcfScore(allFull());
    expect(r.layer2_financial.normalized).toBe(20);
  });

  it('partial on one criterion scores 2.5 (half of 5)', () => {
    const input = allFull();
    input.layer2.annualFinancialStatement = 'partial';
    const r = computeCtcfScore(input);
    // earned = 2.5 + 5 + 5 + 5 = 17.5; max = 20; norm = 17.5
    expect(r.layer2_financial.normalized).toBeCloseTo(17.5, 1);
  });

  it('no on one criterion scores 0 for that criterion', () => {
    const input = allFull();
    input.layer2.auditEvidence = 'no';
    const r = computeCtcfScore(input);
    // earned = 5 + 0 + 5 + 5 = 15; norm = 15
    expect(r.layer2_financial.normalized).toBeCloseTo(15, 1);
  });

  it('N/A on zakatSegregation normalises correctly (max 15, still worth 20)', () => {
    const input = allFull();
    input.layer2.zakatSegregation = 'na';
    const r = computeCtcfScore(input);
    // earned = 5+5+5 = 15; maxApplicable = 15; norm = (15/15)*20 = 20
    expect(r.layer2_financial.normalized).toBeCloseTo(20, 1);
  });

  it('Layer 2 floor blocks certification when normalised L2 < 10', () => {
    const input = allFull();
    // All L2 criteria set to 'no' → normalized = 0 < 10
    input.layer2.annualFinancialStatement = 'no';
    input.layer2.auditEvidence            = 'no';
    input.layer2.programAdminBreakdown    = 'no';
    input.layer2.zakatSegregation         = 'no';
    const r = computeCtcfScore(input);
    expect(r.layer2_passes_minimum).toBe(false);
    expect(r.is_certifiable).toBe(false);
  });

  it('L2 floor passes when normalised L2 = 10 exactly (two partials + one full)', () => {
    const input = allFull();
    // full(5) + partial(2.5) + partial(2.5) + no(0) = 10; max=20; norm=10
    input.layer2.annualFinancialStatement = 'full';
    input.layer2.auditEvidence            = 'partial';
    input.layer2.programAdminBreakdown    = 'partial';
    input.layer2.zakatSegregation         = 'no';
    const r = computeCtcfScore(input);
    expect(r.layer2_financial.normalized).toBeCloseTo(10, 1);
    expect(r.layer2_passes_minimum).toBe(true);
  });
});

// =============================================================
// LAYER 3 — PROJECT TRANSPARENCY
// =============================================================
describe('Layer 3 — Project Transparency', () => {
  it('scores 25/25 when all criteria are full', () => {
    expect(computeCtcfScore(allFull()).layer3_project.normalized).toBe(25);
  });

  it('N/A on geo and beforeAfterDocs normalises to 25 when remaining 3 are full', () => {
    const input = allFull();
    input.layer3.geoVerifiedReporting = 'na';
    input.layer3.beforeAfterDocs      = 'na';
    // earned=5+5+5=15; maxApplicable=15; norm=(15/15)*25=25
    const r = computeCtcfScore(input);
    expect(r.layer3_project.normalized).toBeCloseTo(25, 1);
  });

  it('partial on one criterion gives 2.5 pts for that criterion', () => {
    const input = allFull();
    input.layer3.completionTimeliness = 'partial';
    // earned=5+5+5+5+2.5=22.5; max=25; norm=22.5
    const r = computeCtcfScore(input);
    expect(r.layer3_project.normalized).toBeCloseTo(22.5, 1);
  });

  it('all N/A gives full layer score (25)', () => {
    const input = allFull();
    input.layer3.budgetVsActual       = 'na';
    input.layer3.geoVerifiedReporting = 'na';
    input.layer3.beforeAfterDocs      = 'na';
    input.layer3.beneficiaryMetrics   = 'na';
    input.layer3.completionTimeliness = 'na';
    const r = computeCtcfScore(input);
    expect(r.layer3_project.normalized).toBe(25);
  });
});

// =============================================================
// LAYER 4 — IMPACT & SUSTAINABILITY
// =============================================================
describe('Layer 4 — Impact & Sustainability', () => {
  it('scores 20/20 when all criteria are full', () => {
    expect(computeCtcfScore(allFull()).layer4_impact.normalized).toBe(20);
  });

  it('partial on kpiQualityAndToC gives 2.5 pts', () => {
    const input = allFull();
    input.layer4.kpiQualityAndToC = 'partial';
    // earned=2.5+5+5+5=17.5; norm=17.5
    const r = computeCtcfScore(input);
    expect(r.layer4_impact.normalized).toBeCloseTo(17.5, 1);
  });

  it('no on all criteria scores 0', () => {
    const input = allFull();
    input.layer4.kpiQualityAndToC    = 'no';
    input.layer4.sustainabilityPlan  = 'no';
    input.layer4.continuityTracking  = 'no';
    input.layer4.impactPerCostMetric = 'no';
    const r = computeCtcfScore(input);
    expect(r.layer4_impact.normalized).toBe(0);
  });
});

// =============================================================
// LAYER 5 — SHARIAH GOVERNANCE
// =============================================================
describe('Layer 5 — Shariah Governance', () => {
  it('scores 15/15 when all criteria applicable and full', () => {
    expect(computeCtcfScore(allFull()).layer5_shariah.normalized).toBe(15);
  });

  it('partial on shariahAdvisor gives 2 pts (max 5 × 0.5 = 2.5)', () => {
    const input = allFull();
    input.layer5.shariahAdvisor = 'partial';
    // earned=2.5+3+3+4=12.5; max=15; norm=12.5
    const r = computeCtcfScore(input);
    expect(r.layer5_shariah.normalized).toBeCloseTo(12.5, 1);
  });

  it('N/A on both zakat and waqf normalises to 15 from base 8', () => {
    const input = allFull();
    input.layer5.zakatEligibilityGov = 'na';
    input.layer5.waqfAssetGovernance = 'na';
    // earned=5+3=8; maxApplicable=8; norm=(8/8)*15=15
    const r = computeCtcfScore(input);
    expect(r.layer5_shariah.normalized).toBeCloseTo(15, 1);
  });

  it('N/A on waqf only normalises correctly', () => {
    const input = allFull();
    input.layer5.waqfAssetGovernance = 'na';
    // earned=5+3+3=11; maxApplicable=11; norm=(11/11)*15=15
    const r = computeCtcfScore(input);
    expect(r.layer5_shariah.normalized).toBeCloseTo(15, 1);
  });

  it('no on shariahAdvisor deducts 5 pts (max applicable)', () => {
    const input = allFull();
    input.layer5.shariahAdvisor = 'no';
    // earned=0+3+3+4=10; max=15; norm=(10/15)*15=10
    const r = computeCtcfScore(input);
    expect(r.layer5_shariah.normalized).toBeCloseTo(10, 1);
  });
});

// =============================================================
// TOTAL SCORE, NORMALISATION, AND GRADES
// =============================================================
describe('Total score and normalisation', () => {
  it('returns total_score = 100 when all criteria are full', () => {
    const r = computeCtcfScore(allFull());
    // raw = 20+25+20+15 = 80; normalised = (80/80)*100 = 100
    expect(r.raw_total).toBe(80);
    expect(r.total_score).toBe(100);
  });

  it('normalises correctly for a partial result', () => {
    const input = allFull();
    // Make all L2 partial: earned=2.5+2.5+2.5+2.5=10; norm=10
    input.layer2.annualFinancialStatement = 'partial';
    input.layer2.auditEvidence            = 'partial';
    input.layer2.programAdminBreakdown    = 'partial';
    input.layer2.zakatSegregation         = 'partial';
    const r = computeCtcfScore(input);
    // raw = 10 + 25 + 20 + 15 = 70; total = (70/80)*100 = 87.5
    expect(r.raw_total).toBeCloseTo(70, 1);
    expect(r.total_score).toBeCloseTo(87.5, 1);
  });

  it('Platinum grade at ≥ 85', () => {
    const r = computeCtcfScore(allFull());
    expect(r.grade).toBe(CTCF_GRADES.PLATINUM.label);
    expect(r.is_certifiable).toBe(true);
  });

  it('Gold grade at 70–84', () => {
    const input = allFull();
    // Drop ~2 criteria to partial to land in 70–84 range
    input.layer2.annualFinancialStatement = 'partial'; // -2.5 raw
    input.layer2.auditEvidence            = 'partial'; // -2.5 raw
    input.layer3.completionTimeliness     = 'partial'; // -2.5 raw
    // raw = 80 - 2.5 - 2.5 - 2.5 = 72.5; total = 90.625 — still Platinum.
    // Let's set multiple criteria to 'no':
    input.layer2.annualFinancialStatement = 'no';  // -5 raw
    input.layer2.auditEvidence            = 'no';  // -5 raw
    input.layer3.completionTimeliness     = 'no';  // -5 raw
    input.layer4.impactPerCostMetric      = 'no';  // -5 raw
    // raw = 80 - 5 - 5 - 5 - 5 = 60; total = (60/80)*100 = 75 → Gold
    const r = computeCtcfScore(input);
    expect(r.total_score).toBeCloseTo(75, 1);
    expect(r.grade).toBe(CTCF_GRADES.GOLD.label);
  });

  it('Silver grade at 55–69', () => {
    const input = allFull();
    // Drop enough criteria to reach 55–69
    input.layer2.annualFinancialStatement = 'no';
    input.layer2.auditEvidence            = 'no';
    input.layer2.programAdminBreakdown    = 'no';
    input.layer3.completionTimeliness     = 'no';
    input.layer4.kpiQualityAndToC         = 'no';
    input.layer4.continuityTracking       = 'no';
    // raw = 80 - 5-5-5-5-5-5 = 50; total = (50/80)*100 = 62.5 → Silver
    const r = computeCtcfScore(input);
    expect(r.total_score).toBeCloseTo(62.5, 1);
    expect(r.grade).toBe(CTCF_GRADES.SILVER.label);
    expect(r.is_certifiable).toBe(true);
  });

  it('Not Certified when total_score < 55', () => {
    const input = allFull();
    // Drop many criteria to go below 55
    input.layer2.annualFinancialStatement = 'no';
    input.layer2.auditEvidence            = 'no';
    input.layer2.programAdminBreakdown    = 'no';
    input.layer2.zakatSegregation         = 'no';
    input.layer3.budgetVsActual           = 'no';
    input.layer3.geoVerifiedReporting     = 'no';
    input.layer3.completionTimeliness     = 'no';
    // raw = 80 - 5-5-5-5-5-5-5 = 45; total = (45/80)*100 = 56.25 — still above 55
    // Need more: remove one more
    input.layer4.kpiQualityAndToC = 'no';
    // raw = 40; total = (40/80)*100 = 50 → Not Certified
    const r = computeCtcfScore(input);
    expect(r.total_score).toBeCloseTo(50, 1);
    expect(r.grade).toBe(CTCF_GRADES.NONE.label);
    expect(r.is_certifiable).toBe(false);
  });

  it('RAW_MAX_SCORE constant equals 80', () => {
    expect(RAW_MAX_SCORE).toBe(80);
  });

  it('CERTIFICATION_THRESHOLD constant equals 55', () => {
    expect(CERTIFICATION_THRESHOLD).toBe(55);
  });

  it('LAYER2_MINIMUM constant equals 10', () => {
    expect(LAYER2_MINIMUM).toBe(10);
  });
});

// =============================================================
// SIZE BAND STORED IN RESULT
// =============================================================
describe('Size band', () => {
  it('stores the size band in the result', () => {
    const input = allFull();
    input.sizeBand = 'large';
    const r = computeCtcfScore(input);
    expect(r.size_band).toBe('large');
  });
});

// =============================================================
// BREAKDOWN STRUCTURE
// =============================================================
describe('Breakdown structure', () => {
  it('includes normalised_total in breakdown', () => {
    const r = computeCtcfScore(allFull());
    expect((r.breakdown as any).normalized_total).toBe(100);
  });

  it('includes raw_total in breakdown', () => {
    const r = computeCtcfScore(allFull());
    expect((r.breakdown as any).raw_total).toBe(80);
  });
});

// =============================================================
// NOTES CONTENT
// =============================================================
describe('Notes in layer results', () => {
  it('records partial criteria in notes', () => {
    const input = allFull();
    input.layer2.auditEvidence = 'partial';
    const r = computeCtcfScore(input);
    expect(r.layer2_financial.notes).toContain('Partial');
  });

  it('records no criteria in notes', () => {
    const input = allFull();
    input.layer4.kpiQualityAndToC = 'no';
    const r = computeCtcfScore(input);
    expect(r.layer4_impact.notes).toContain('Not met');
  });

  it('records N/A criteria in notes', () => {
    const input = allFull();
    input.layer3.geoVerifiedReporting = 'na';
    const r = computeCtcfScore(input);
    expect(r.layer3_project.notes).toContain('N/A');
  });

  it('notes show "All criteria fully met" when no issues', () => {
    const r = computeCtcfScore(allFull());
    expect(r.layer2_financial.notes).toBe('All criteria fully met.');
  });
});

// =============================================================
// ctcf_v1 ARCHIVE — smoke test that archived engine still works
// =============================================================
describe('computeCtcfScore_v1 (archive)', () => {
  function v1AllTrue(): CtcfInputV1 {
    return {
      layer1: {
        hasLegalRegistration: true, hasGoverningDocument: true,
        hasNamedBoard: true, hasConflictOfInterest: true,
        hasBankAccountSeparation: true, hasContactAndAddress: true,
      },
      layer2: {
        hasAnnualFinancialStatement: true, hasAuditEvidence: true,
        hasProgramAdminBreakdown: true, hasZakatSegregation: true,
      },
      layer3: {
        hasBudgetVsActual: true, hasGeoVerifiedReporting: true,
        hasBeforeAfterDocs: true, hasBeneficiaryMetrics: true,
        hasCompletionTimeliness: true,
      },
      layer4: {
        hasKpisDefined: true, hasSustainabilityPlan: true,
        hasContinuityTracking: true, hasImpactPerCostMetric: true,
      },
      layer5: {
        hasShariahAdvisor: true, hasShariahPolicy: true,
        hasZakatEligibilityGov: true, hasWaqfAssetGovernance: true,
      },
    };
  }

  it('v1 engine still produces a valid result for all-true input', () => {
    const r = computeCtcfScore_v1(v1AllTrue());
    expect(r.version).toBe('ctcf_v1');
    expect(r.layer1_gate.passed).toBe(true);
    expect(r.total_score).toBe(80); // v1 raw score out of 80 (no 0–100 normalisation in v1)
  });

  it('v1 gate failure zeroes the score', () => {
    const input = v1AllTrue();
    input.layer1.hasLegalRegistration = false;
    const r = computeCtcfScore_v1(input);
    expect(r.layer1_gate.passed).toBe(false);
    expect(r.total_score).toBe(0);
  });
});
