// apps/user/lib/trust-grade.ts
// Compatibility wrapper. Canonical Amanah tier logic lives in @agp/scoring.

import { getAmanahTier, type AmanahTier } from '@agp/scoring';

export type TrustGrade = AmanahTier;

export function getTrustGrade(score: number | string | null | undefined) {
  const tier = getAmanahTier(score);

  return {
    grade: tier.tier,
    label: tier.shortLabel,
    gradeSublabel: tier.sublabel,
    color:
      tier.tier === 'platinum' ? '#475569' :
      tier.tier === 'gold' ? '#b45309' :
      tier.tier === 'silver' ? '#64748b' :
      tier.tier === 'bronze' ? '#c2410c' :
      tier.tier === 'foundation' ? '#2563eb' :
      '#64748b',
  };
}
