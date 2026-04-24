// components/ui/badge.tsx
// AmanahHub — Badge component
// Tier labels are routed through the canonical @agp/scoring adapter in score-ring.tsx.

import { scoreTier, tierLabel, type Tier as ScoreTier } from './score-ring';

type Variant = 'green' | 'amber' | 'blue' | 'purple' | 'gray' | 'red' | 'orange';

const variantClass: Record<Variant, string> = {
  green:  'badge-green',
  amber:  'badge-amber',
  blue:   'badge-blue',
  purple: 'badge-purple',
  gray:   'badge-gray',
  red:    'badge-red',
  orange: 'badge-amber',
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

function tierVariant(tier: ScoreTier): Variant {
  switch (tier) {
    case 'platinum':
      return 'purple';
    case 'gold':
      return 'amber';
    case 'silver':
      return 'gray';
    case 'bronze':
      return 'orange';
    case 'foundation':
      return 'blue';
    default:
      return 'gray';
  }
}

export function TierBadge({ score }: { score: number }) {
  const tier = scoreTier(score);
  const v = tierVariant(tier);

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
