// apps/org/lib/amanah-tiers.ts
// Thin app adapter. Canonical Amanah tier logic lives in @agp/scoring.

export {
  AMANAH_TIERS,
  getAmanahTier,
  getAmanahTierKey,
  getAmanahTierLabel,
  getAmanahTierShortLabel,
  formatAmanahScore,
  formatAmanahScoreWithMax,
  type AmanahTier,
  type AmanahTierInfo,
} from '@agp/scoring';
