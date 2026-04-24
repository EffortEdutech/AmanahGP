import {
  getAmanahTier,
  formatAmanahScore,
  type AmanahTier,
} from '@agp/scoring';

export type Tier = AmanahTier;

export function scoreTier(score: number | string | null | undefined): Tier {
  return getAmanahTier(score).tier;
}

export function tierLabel(tier: Tier | string | null | undefined): string {
  switch (tier) {
    case 'platinum':
      return 'Platinum';
    case 'gold':
      return 'Gold';
    case 'silver':
      return 'Silver';
    case 'bronze':
      return 'Bronze';
    case 'foundation':
      return 'Foundation';
    default:
      return 'Amanah';
  }
}

export function tierFullLabel(tier: Tier | string | null | undefined): string {
  switch (tier) {
    case 'platinum':
      return 'Platinum Amanah';
    case 'gold':
      return 'Gold Amanah';
    case 'silver':
      return 'Silver Amanah';
    case 'bronze':
      return 'Bronze Amanah';
    case 'foundation':
      return 'Foundation Amanah';
    default:
      return 'Building public trust profile';
  }
}

type ScoreRingProps = {
  score: number | string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
};

const SIZE_CLASS = {
  sm: 'h-14 w-14 text-lg',
  md: 'h-20 w-20 text-2xl',
  lg: 'h-28 w-28 text-4xl',
};

const TIER_CLASS: Record<AmanahTier, string> = {
  platinum: 'bg-slate-50 ring-1 ring-slate-300 text-slate-800',
  gold: 'bg-amber-50 ring-1 ring-amber-200 text-amber-800',
  silver: 'bg-gray-50 ring-1 ring-gray-300 text-gray-700',
  bronze: 'bg-orange-50 ring-1 ring-orange-200 text-orange-800',
  foundation: 'bg-blue-50 ring-1 ring-blue-200 text-blue-800',
  none: 'bg-gray-50 ring-1 ring-gray-200 text-gray-500',
};

export function ScoreRing({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}: ScoreRingProps) {
  const tier = getAmanahTier(score);
  const scoreText = formatAmanahScore(score);
  const hasScore = scoreText !== 'In progress';

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div
        className={[
          'rounded-full flex items-center justify-center font-black',
          SIZE_CLASS[size] ?? SIZE_CLASS.md,
          TIER_CLASS[tier.tier] ?? TIER_CLASS.none,
        ].join(' ')}
      >
        {hasScore ? scoreText : '—'}
      </div>

      {showLabel && (
        <div className="text-center leading-tight">
          <div className="text-xs font-bold text-gray-900">
            {tier.shortLabel}
          </div>
          <div className="text-[10px] text-gray-500">
            {tier.sublabel}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScoreRing;
