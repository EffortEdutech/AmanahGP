// apps/admin/components/ui/badge.tsx
// AmanahHub Console — Badge component (Sprint 8 UI uplift)

export type BadgeVariant = 'green' | 'amber' | 'blue' | 'purple' | 'gray' | 'red';

const cls: Record<BadgeVariant, string> = {
  green:  'badge-green',
  amber:  'badge-amber',
  blue:   'badge-blue',
  purple: 'badge-purple',
  gray:   'badge-gray',
  red:    'badge-red',
};

export function Badge({
  children, variant = 'gray', className = '',
}: {
  children: React.ReactNode; variant?: BadgeVariant; className?: string;
}) {
  return (
    <span className={`badge ${cls[variant]} ${className}`}>{children}</span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [BadgeVariant, string]> = {
    confirmed:          ['green',  'Confirmed'],
    certified:          ['green',  'Certified'],
    verified:           ['green',  'Verified'],
    approved:           ['green',  'Approved'],
    listed:             ['green',  'Listed'],
    active:             ['green',  'Active'],
    completed:          ['blue',   'Completed'],
    submitted:          ['blue',   'Submitted'],
    under_review:       ['amber',  'Under review'],
    changes_requested:  ['amber',  'Changes requested'],
    pending:            ['amber',  'Pending'],
    initiated:          ['amber',  'Initiated'],
    draft:              ['gray',   'Draft'],
    not_certified:      ['gray',   'Not certified'],
    private:            ['gray',   'Private'],
    unlisted:           ['gray',   'Unlisted'],
    suspended:          ['red',    'Suspended'],
    rejected:           ['red',    'Rejected'],
    failed:             ['red',    'Failed'],
  };
  const [v, label] = map[status] ?? ['gray', status.replace(/_/g, ' ')];
  return <Badge variant={v}>{label}</Badge>;
}

export function OrgRoleBadge({ role }: { role: string }) {
  return <span className="badge badge-gray">{role}</span>;
}
