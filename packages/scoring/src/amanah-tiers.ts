// packages/scoring/src/amanah-tiers.ts
// Canonical Amanah Index tier definitions shared by AmanahHub, AmanahOS, and AGP Console.

export type AmanahTier =
  | 'platinum'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'foundation'
  | 'none';

export type AmanahTierInfo = {
  tier: AmanahTier;
  label: string;
  shortLabel: string;
  sublabel: string;
  minScore: number | null;
  maxScore: number | null;
};

export const AMANAH_TIERS: Record<AmanahTier, AmanahTierInfo> = {
  platinum: { tier: 'platinum', label: 'Platinum Amanah', shortLabel: 'Platinum', sublabel: 'Exceptional governance', minScore: 85, maxScore: 100 },
  gold: { tier: 'gold', label: 'Gold Amanah', shortLabel: 'Gold', sublabel: 'Highly trusted', minScore: 70, maxScore: 84.99 },
  silver: { tier: 'silver', label: 'Silver Amanah', shortLabel: 'Silver', sublabel: 'Trusted governance', minScore: 55, maxScore: 69.99 },
  bronze: { tier: 'bronze', label: 'Bronze Amanah', shortLabel: 'Bronze', sublabel: 'Developing governance', minScore: 40, maxScore: 54.99 },
  foundation: { tier: 'foundation', label: 'Foundation Amanah', shortLabel: 'Foundation', sublabel: 'Early governance stage', minScore: 1, maxScore: 39.99 },
  none: { tier: 'none', label: 'Building public trust profile', shortLabel: 'Amanah', sublabel: 'Score in progress', minScore: null, maxScore: null },
};

export function getAmanahTier(score: number | string | null | undefined): AmanahTierInfo {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return AMANAH_TIERS.none;
  if (n >= 85) return AMANAH_TIERS.platinum;
  if (n >= 70) return AMANAH_TIERS.gold;
  if (n >= 55) return AMANAH_TIERS.silver;
  if (n >= 40) return AMANAH_TIERS.bronze;
  return AMANAH_TIERS.foundation;
}

export function getAmanahTierKey(score: number | string | null | undefined): AmanahTier {
  return getAmanahTier(score).tier;
}

export function getAmanahTierLabel(score: number | string | null | undefined): string {
  return getAmanahTier(score).label;
}

export function getAmanahTierShortLabel(score: number | string | null | undefined): string {
  return getAmanahTier(score).shortLabel;
}

export function formatAmanahScore(score: number | string | null | undefined): string {
  const n = Number(score);
  if (!Number.isFinite(n) || n <= 0) return 'In progress';
  return String(Math.round(n));
}

export function formatAmanahScoreWithMax(score: number | string | null | undefined): string {
  const formatted = formatAmanahScore(score);
  return formatted === 'In progress' ? formatted : `${formatted}/100`;
}
