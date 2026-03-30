// packages/scoring/src/__tests__/amanah.test.ts
// Amanah Governance Platform — Amanah Index™ unit tests

import { describe, it, expect } from 'vitest';
import {
  computeAmanahScore,
  computeGovernanceScore,
  computeFinancialScore,
  computeProjectScore,
  computeImpactScore,
  computeFeedbackScore,
  AMANAH_WEIGHTS,
  type AmanahInput,
} from '../amanah';

// ── Helpers ───────────────────────────────────────────────────
function fullInput(): AmanahInput {
  return {
    organizationId:             'test-org',
    governanceScore:            100,
    financialTransparencyScore: 100,
    projectTransparencyScore:   100,
    impactEfficiencyScore:      100,
    feedbackScore:              100,
    triggerEvent:               'manual_recalc',
  };
}

// =============================================================
// WEIGHTED FORMULA
// =============================================================
describe('Amanah weighted formula', () => {
  it('returns 100 when all components are 100', () => {
    const result = computeAmanahScore(fullInput());
    expect(result.score).toBe(100);
    expect(result.version).toBe('amanah_v1');
  });

  it('returns 0 when all components are 0', () => {
    const input = { ...fullInput(),
      governanceScore: 0, financialTransparencyScore: 0,
      projectTransparencyScore: 0, impactEfficiencyScore: 0, feedbackScore: 0,
    };
    const result = computeAmanahScore(input);
    expect(result.score).toBe(0);
  });

  it('applies weights correctly', () => {
    const result = computeAmanahScore(fullInput());
    const { weighted_contributions } = result.breakdown;
    expect(weighted_contributions.governance).toBeCloseTo(30, 1);
    expect(weighted_contributions.financial).toBeCloseTo(25, 1);
    expect(weighted_contributions.project).toBeCloseTo(20, 1);
    expect(weighted_contributions.impact).toBeCloseTo(15, 1);
    expect(weighted_contributions.feedback).toBeCloseTo(10, 1);
  });

  it('weights sum to 1.0', () => {
    const sum = Object.values(AMANAH_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('clamps inputs above 100 to 100', () => {
    const input = { ...fullInput(), governanceScore: 150 };
    const result = computeAmanahScore(input);
    expect(result.breakdown.governance_score).toBe(100);
    expect(result.score).toBe(100);
  });

  it('clamps inputs below 0 to 0', () => {
    const input = { ...fullInput(), governanceScore: -50 };
    const result = computeAmanahScore(input);
    expect(result.breakdown.governance_score).toBe(0);
  });

  it('computes a realistic mixed score correctly', () => {
    // Approved+listed org, 1 verified report, no financial yet
    const input: AmanahInput = {
      organizationId:             'test-org',
      governanceScore:            80,   // approved+listed, no CTCF gate yet
      financialTransparencyScore: 0,    // no financial submission
      projectTransparencyScore:   60,   // 1 verified report
      impactEfficiencyScore:      40,   // some data
      feedbackScore:              70,   // baseline
      triggerEvent:               'report_verified',
    };
    const expected =
      80 * 0.30 + 0 * 0.25 + 60 * 0.20 + 40 * 0.15 + 70 * 0.10;
    const result = computeAmanahScore(input);
    expect(result.score).toBeCloseTo(expected, 2);
  });

  it('includes public summary in output', () => {
    const result = computeAmanahScore(fullInput());
    expect(result.publicSummary).toBeTruthy();
    expect(typeof result.publicSummary).toBe('string');
  });
});

// =============================================================
// COMPONENT SCORE HELPERS
// =============================================================
describe('computeGovernanceScore', () => {
  it('returns 100 for approved+listed+CTCF gate passed', () => {
    expect(computeGovernanceScore({
      onboardingStatus: 'approved', listingStatus: 'listed', ctcfGatePassed: true,
    })).toBe(100);
  });

  it('returns 80 for approved+listed but no CTCF gate', () => {
    expect(computeGovernanceScore({
      onboardingStatus: 'approved', listingStatus: 'listed', ctcfGatePassed: false,
    })).toBe(80);
  });

  it('returns 60 for approved but not listed', () => {
    expect(computeGovernanceScore({
      onboardingStatus: 'approved', listingStatus: 'private', ctcfGatePassed: false,
    })).toBe(60);
  });

  it('returns 0 for draft org', () => {
    expect(computeGovernanceScore({
      onboardingStatus: 'draft', listingStatus: 'private', ctcfGatePassed: false,
    })).toBe(0);
  });
});

describe('computeFinancialScore', () => {
  it('returns 100 for recently verified snapshot', () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 3); // 3 months ago
    expect(computeFinancialScore({
      verificationStatus: 'verified',
      verifiedAt: recentDate.toISOString(),
    })).toBe(100);
  });

  it('returns 70 for old verified snapshot (>18 months)', () => {
    const oldDate = new Date();
    oldDate.setMonth(oldDate.getMonth() - 20); // 20 months ago
    expect(computeFinancialScore({
      verificationStatus: 'verified',
      verifiedAt: oldDate.toISOString(),
    })).toBe(70);
  });

  it('returns 50 for submitted but not verified', () => {
    expect(computeFinancialScore({
      verificationStatus: 'submitted', verifiedAt: null,
    })).toBe(50);
  });

  it('returns 0 for no submission', () => {
    expect(computeFinancialScore({
      verificationStatus: null, verifiedAt: null,
    })).toBe(0);
  });
});

describe('computeProjectScore', () => {
  it('returns 100 for 3+ reports with recent verification', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 30); // 30 days ago
    expect(computeProjectScore({
      verifiedReportCount: 3,
      mostRecentVerifiedAt: recent.toISOString(),
    })).toBe(100);
  });

  it('returns 80 for 2 reports', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 200);
    expect(computeProjectScore({
      verifiedReportCount: 2,
      mostRecentVerifiedAt: recent.toISOString(),
    })).toBe(80);
  });

  it('returns 60 for 1 old report', () => {
    const old = new Date();
    old.setDate(old.getDate() - 200);
    expect(computeProjectScore({
      verifiedReportCount: 1,
      mostRecentVerifiedAt: old.toISOString(),
    })).toBe(60);
  });

  it('returns 0 for no verified reports', () => {
    expect(computeProjectScore({
      verifiedReportCount: 0, mostRecentVerifiedAt: null,
    })).toBe(0);
  });
});

describe('computeImpactScore', () => {
  it('returns 100 with all three data points', () => {
    expect(computeImpactScore({
      hasBeneficiaryData: true, hasSpendData: true, hasKpiTargets: true,
    })).toBe(100);
  });

  it('returns 70 with two data points', () => {
    expect(computeImpactScore({
      hasBeneficiaryData: true, hasSpendData: true, hasKpiTargets: false,
    })).toBe(70);
  });

  it('returns 40 with one data point', () => {
    expect(computeImpactScore({
      hasBeneficiaryData: true, hasSpendData: false, hasKpiTargets: false,
    })).toBe(40);
  });

  it('returns 0 with no data', () => {
    expect(computeImpactScore({
      hasBeneficiaryData: false, hasSpendData: false, hasKpiTargets: false,
    })).toBe(0);
  });
});

describe('computeFeedbackScore', () => {
  it('returns 70 baseline with no complaints', () => {
    expect(computeFeedbackScore({ complaintsLogged: 0, complaintsResolved: 0 })).toBe(70);
  });

  it('returns 70 with high resolution rate (≥90%)', () => {
    expect(computeFeedbackScore({ complaintsLogged: 10, complaintsResolved: 9 })).toBe(70);
  });

  it('returns 50 with 70–89% resolution', () => {
    expect(computeFeedbackScore({ complaintsLogged: 10, complaintsResolved: 7 })).toBe(50);
  });

  it('returns 30 with 50–69% resolution', () => {
    expect(computeFeedbackScore({ complaintsLogged: 10, complaintsResolved: 5 })).toBe(30);
  });

  it('returns 10 with <50% resolution', () => {
    expect(computeFeedbackScore({ complaintsLogged: 10, complaintsResolved: 3 })).toBe(10);
  });
});
