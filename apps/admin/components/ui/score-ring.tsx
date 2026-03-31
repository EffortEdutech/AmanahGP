// apps/admin/components/ui/score-ring.tsx
// AmanahHub Console — Score ring (Sprint 8 UI uplift)

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

const ringCls: Record<ScoreTier, string> = {
  platinum: 'score-ring-platinum',
  gold:     'score-ring-gold',
  silver:   'score-ring-silver',
  basic:    'score-ring-basic',
};

const sizes = {
  sm: { wrap: 'w-10 h-10', score: 'text-base',    lbl: 'text-[7px]'  },
  md: { wrap: 'w-14 h-14', score: 'text-[20px]',  lbl: 'text-[9px]'  },
  lg: { wrap: 'w-20 h-20', score: 'text-[32px]',  lbl: 'text-[10px]' },
};

export function ScoreRing({
  score, size = 'md', showLabel = true,
}: {
  score: number; size?: 'sm' | 'md' | 'lg'; showLabel?: boolean;
}) {
  const tier = scoreTier(score);
  const sz   = sizes[size];
  return (
    <div className={`score-ring ${ringCls[tier]} ${sz.wrap}`}>
      <span className={`${sz.score} font-semibold leading-none`}>{Math.round(score)}</span>
      {showLabel && (
        <span className={`${sz.lbl} opacity-60 mt-0.5`}>{tierLabel(tier)}</span>
      )}
    </div>
  );
}
