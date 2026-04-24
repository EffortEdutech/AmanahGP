// apps/user/components/ui/trust-badge.tsx
// AmanahHub — Trust Badge Component
// Canonical Amanah tier display.
// Tier thresholds live in @agp/scoring.

import type { AmanahTier } from '@agp/scoring';

type Grade = AmanahTier | 'building';

interface TrustBadgeProps {
  score: number;
  grade: Grade | string | null | undefined;
  gradeLabel: string;
  gradeSublabel: string;
  lastUpdated?: string | null;
  size?: 'sm' | 'md' | 'lg';
  certified?: boolean;
}

type GradeStyle = {
  ring: string;
  bg: string;
  shield: string;
  label: string;
  text: string;
  score: string;
};

const GRADE_STYLES: Record<AmanahTier, GradeStyle> = {
  platinum: {
    ring: 'ring-2 ring-slate-400',
    bg: 'bg-gradient-to-br from-slate-100 to-slate-200',
    shield: 'text-slate-500',
    label: 'text-slate-700',
    text: 'text-slate-500',
    score: 'text-slate-800',
  },
  gold: {
    ring: 'ring-2 ring-amber-400',
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    shield: 'text-amber-500',
    label: 'text-amber-800',
    text: 'text-amber-600',
    score: 'text-amber-900',
  },
  silver: {
    ring: 'ring-2 ring-gray-400',
    bg: 'bg-gradient-to-br from-gray-100 to-slate-200',
    shield: 'text-gray-500',
    label: 'text-gray-700',
    text: 'text-gray-500',
    score: 'text-gray-800',
  },
  bronze: {
    ring: 'ring-2 ring-orange-400',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-100',
    shield: 'text-orange-500',
    label: 'text-orange-800',
    text: 'text-orange-600',
    score: 'text-orange-900',
  },
  foundation: {
    ring: 'ring-2 ring-blue-300',
    bg: 'bg-gradient-to-br from-blue-50 to-sky-100',
    shield: 'text-blue-500',
    label: 'text-blue-800',
    text: 'text-blue-600',
    score: 'text-blue-900',
  },
  none: {
    ring: 'ring-1 ring-gray-200',
    bg: 'bg-gray-50',
    shield: 'text-gray-200',
    label: 'text-gray-400',
    text: 'text-gray-300',
    score: 'text-gray-500',
  },
};

const SIZE = {
  sm: { outer: 'p-3', shield: 'w-6 h-6', score: 'text-lg', label: 'text-[10px]', detail: 'text-[9px]' },
  md: { outer: 'p-4', shield: 'w-8 h-8', score: 'text-2xl', label: 'text-[11px]', detail: 'text-[10px]' },
  lg: { outer: 'p-5', shield: 'w-10 h-10', score: 'text-3xl', label: 'text-[13px]', detail: 'text-[11px]' },
};

function normalizeGrade(grade: TrustBadgeProps['grade']): AmanahTier {
  if (
    grade === 'platinum' ||
    grade === 'gold' ||
    grade === 'silver' ||
    grade === 'bronze' ||
    grade === 'foundation' ||
    grade === 'none'
  ) {
    return grade;
  }

  // Backward compatibility with old AmanahHub label.
  if (grade === 'building') return 'none';

  return 'none';
}

export function TrustBadge({
  score,
  grade,
  gradeLabel,
  gradeSublabel,
  lastUpdated,
  size = 'md',
  certified,
}: TrustBadgeProps) {
  const normalizedGrade = normalizeGrade(grade);
  const styles = GRADE_STYLES[normalizedGrade] ?? GRADE_STYLES.none;
  const sz = SIZE[size] ?? SIZE.md;

  const timeAgo = lastUpdated
    ? formatTimeAgo(new Date(lastUpdated))
    : null;

  return (
    <div className={`rounded-2xl border border-gray-200 ${styles.bg} ${styles.ring} ${sz.outer} space-y-3`}>
      <div className="flex items-center gap-3">
        <ShieldIcon className={`${sz.shield} ${styles.shield} flex-shrink-0`} />
        <div>
          <p className={`font-bold ${sz.label} ${styles.label} uppercase tracking-wide`}>
            {gradeLabel} Amanah
          </p>
          <p className={`${sz.detail} ${styles.text}`}>{gradeSublabel}</p>
        </div>

        {certified && (
          <span className="ml-auto flex-shrink-0 text-[9px] font-bold px-2 py-1 rounded-full
                           bg-emerald-500 text-white uppercase tracking-wide">
            Certified
          </span>
        )}
      </div>

      {score > 0 && (
        <div className="flex items-baseline gap-1">
          <span className={`font-black ${sz.score} ${styles.score}`}>
            {score.toFixed(1)}
          </span>
          <span className={`${sz.detail} ${styles.text} font-medium`}>/100</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className={`${sz.detail} ${styles.text} font-medium`}>
          Verified by Amanah Governance Platform
        </span>
      </div>

      {timeAgo && (
        <p className={`${sz.detail} ${styles.text} -mt-2`}>
          Updated {timeAgo}
        </p>
      )}
    </div>
  );
}

export function TrustBadgeInline({
  score,
  grade,
  gradeLabel,
}: Pick<TrustBadgeProps, 'score' | 'grade' | 'gradeLabel'>) {
  const normalizedGrade = normalizeGrade(grade);
  const styles = GRADE_STYLES[normalizedGrade] ?? GRADE_STYLES.none;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
      border ${styles.ring} ${styles.bg} ${styles.label}
    `}>
      <ShieldIcon className="w-3 h-3 flex-shrink-0" />
      {gradeLabel}
      {score > 0 && <span className={`font-bold ${styles.score}`}>{score.toFixed(0)}</span>}
    </span>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" />
    </svg>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}