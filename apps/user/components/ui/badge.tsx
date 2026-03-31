// components/ui/badge.tsx
// AmanahHub — Badge component (Sprint 7 UI uplift)
// Matches UAT .badge .bg .ba .bb .bp .bgr .bred

import { scoreTier, tierLabel, type ScoreTier } from './score-ring';

type Variant = 'green' | 'amber' | 'blue' | 'purple' | 'gray' | 'red';

const variantClass: Record<Variant, string> = {
  green:  'badge-green',
  amber:  'badge-amber',
  blue:   'badge-blue',
  purple: 'badge-purple',
  gray:   'badge-gray',
  red:    'badge-red',
};

interface BadgeProps {
  children:  React.ReactNode;
  variant?:  Variant;
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  );
}

/* Pre-built semantic badges */

export function CertifiedBadge() {
  return (
    <span className="badge badge-green">
      <svg className="w-2.5 h-2.5 mr-0.5" viewBox="0 0 10 10" fill="currentColor">
        <path d="M8.5 2.5L4 7.5 1.5 5" stroke="currentColor" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      Certified
    </span>
  );
}

export function TierBadge({ score }: { score: number }) {
  const tier = scoreTier(score);
  const v: Variant =
    tier === 'platinum' ? 'purple' :
    tier === 'gold'     ? 'amber'  : 'gray';

  return (
    <span className={`badge ${variantClass[v]}`}>
      {tierLabel(tier)} Amanah
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [Variant, string]> = {
    confirmed:        ['green',  'Confirmed'],
    certified:        ['green',  'Certified'],
    verified:         ['green',  'Verified'],
    approved:         ['green',  'Approved'],
    listed:           ['green',  'Listed'],
    active:           ['green',  'Active'],
    completed:        ['blue',   'Completed'],
    submitted:        ['blue',   'Submitted'],
    under_review:     ['amber',  'Under review'],
    changes_requested:['amber',  'Changes requested'],
    pending:          ['amber',  'Pending'],
    initiated:        ['amber',  'Initiated'],
    draft:            ['gray',   'Draft'],
    not_certified:    ['gray',   'Not certified'],
    suspended:        ['red',    'Suspended'],
    rejected:         ['red',    'Rejected'],
    failed:           ['red',    'Failed'],
  };
  const [variant, label] = map[status] ?? ['gray', status];

  return <Badge variant={variant}>{label}</Badge>;
}
