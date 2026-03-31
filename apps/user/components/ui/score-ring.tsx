// apps/admin/components/ui/score-ring.tsx
// AmanahHub Console — Score ring component (Sprint 11 fix)
// Fully null-safe: never throws on undefined/null/NaN score.

import React from 'react';

// ── Tier helpers (exported for use in other components) ───────
export type Tier = 'platinum' | 'gold' | 'silver' | 'basic';

export function scoreTier(score: number | null | undefined): Tier {
  if (score == null || isNaN(Number(score))) return 'basic';
  const n = Number(score);
  if (n >= 85) return 'platinum';
  if (n >= 70) return 'gold';
  if (n >= 55) return 'silver';
  return 'basic';
}

export function tierLabel(tier: Tier | null | undefined): string {
  if (!tier) return 'Basic';
  const labels: Record<Tier, string> = {
    platinum: 'Platinum',
    gold:     'Gold',
    silver:   'Silver',
    basic:    'Basic',
  };
  return labels[tier] ?? 'Basic';
}

// ── Tier visual config ────────────────────────────────────────
const TIER_CONFIG: Record<Tier, {
  ring:  string;
  bg:    string;
  text:  string;
  label: string;
}> = {
  platinum: {
    ring:  'ring-violet-300',
    bg:    'bg-violet-50',
    text:  'text-violet-800',
    label: 'Platinum',
  },
  gold: {
    ring:  'ring-amber-300',
    bg:    'bg-amber-50',
    text:  'text-amber-800',
    label: 'Gold',
  },
  silver: {
    ring:  'ring-gray-300',
    bg:    'bg-gray-100',
    text:  'text-gray-600',
    label: 'Silver',
  },
  basic: {
    ring:  'ring-gray-200',
    bg:    'bg-gray-100',
    text:  'text-gray-400',
    label: 'Basic',
  },
};

// ── Size config ───────────────────────────────────────────────
const SIZE_CONFIG = {
  xs:  { outer: 'w-8  h-8',  score: 'text-[9px]',  sub: 'hidden' },
  sm:  { outer: 'w-10 h-10', score: 'text-[10px]', sub: 'hidden' },
  md:  { outer: 'w-14 h-14', score: 'text-[13px]', sub: 'text-[8px]' },
  lg:  { outer: 'w-16 h-16', score: 'text-[15px]', sub: 'text-[9px]' },
  xl:  { outer: 'w-20 h-20', score: 'text-[18px]', sub: 'text-[10px]' },
};

// ── Component ─────────────────────────────────────────────────
interface ScoreRingProps {
  score: number | null | undefined;
  size?: keyof typeof SIZE_CONFIG;
  showLabel?: boolean;
}

export function ScoreRing({
  score,
  size = 'md',
  showLabel = false,
}: ScoreRingProps) {
  // Safe coercion — never pass undefined to tier lookup
  const safeScore = (score != null && !isNaN(Number(score))) ? Number(score) : null;
  const tier   = scoreTier(safeScore);
  const config = TIER_CONFIG[tier]; // always defined since Tier is exhaustive
  const sizes  = SIZE_CONFIG[size] ?? SIZE_CONFIG.md;

  return (
    <div className={`
      flex flex-col items-center justify-center rounded-full flex-shrink-0
      ring-2 ${config.ring} ${config.bg} ${sizes.outer}
    `}>
      <span className={`font-bold leading-none ${config.text} ${sizes.score}`}>
        {safeScore !== null ? safeScore.toFixed(safeScore >= 10 ? 0 : 1) : '—'}
      </span>
      {showLabel && sizes.sub !== 'hidden' && (
        <span className={`font-medium leading-none mt-0.5 ${config.text} ${sizes.sub}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
