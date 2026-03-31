// components/ui/score-ring.tsx
// AmanahHub — Amanah score ring (Sprint 7 UI uplift)
// Matches UAT s-dir / s-profile score display

export type ScoreTier = 'platinum' | 'gold' | 'silver' | 'basic';

export function scoreTier(score: number): ScoreTier {
  if (score >= 85) return 'platinum';
  if (score >= 70) return 'gold';
  if (score >= 55) return 'silver';
  return 'basic';
}

export function tierLabel(tier: ScoreTier) {
  return { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', basic: 'Basic' }[tier];
}

const ringClass: Record<ScoreTier, string> = {
  platinum: 'score-ring-platinum',
  gold:     'score-ring-gold',
  silver:   'score-ring-silver',
  basic:    'score-ring-basic',
};

const sizes = {
  sm: { wrap: 'w-12 h-12', score: 'text-lg',    label: 'text-[8px]' },
  md: { wrap: 'w-14 h-14', score: 'text-[20px]', label: 'text-[9px]' },
  lg: { wrap: 'w-20 h-20', score: 'text-3xl',   label: 'text-[10px]' },
};

interface ScoreRingProps {
  score:      number;
  size?:      'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreRing({ score, size = 'md', showLabel = true }: ScoreRingProps) {
  const tier = scoreTier(score);
  const sz   = sizes[size];

  return (
    <div className={`score-ring ${ringClass[tier]} ${sz.wrap}`}>
      <span className={`${sz.score} font-semibold leading-none`}>
        {Math.round(score)}
      </span>
      {showLabel && (
        <span className={`${sz.label} opacity-60 mt-0.5`}>{tierLabel(tier)}</span>
      )}
    </div>
  );
}
