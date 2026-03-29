// apps/admin/components/ui/status-badge.tsx
// AmanahHub Console — Reusable status badge

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<string, string> = {
  // Onboarding
  draft:              'bg-gray-100 text-gray-600',
  submitted:          'bg-blue-50 text-blue-700',
  changes_requested:  'bg-amber-50 text-amber-700',
  approved:           'bg-emerald-50 text-emerald-700',
  rejected:           'bg-red-50 text-red-700',
  // Listing
  listed:             'bg-emerald-50 text-emerald-700',
  private:            'bg-gray-100 text-gray-500',
  unlisted:           'bg-gray-100 text-gray-500',
  suspended:          'bg-red-50 text-red-700',
  // Certification
  certified:          'bg-emerald-50 text-emerald-700',
  not_certified:      'bg-gray-100 text-gray-500',
  // Reports
  verified:           'bg-emerald-50 text-emerald-700',
  pending:            'bg-blue-50 text-blue-700',
  // Donation
  confirmed:          'bg-emerald-50 text-emerald-700',
  failed:             'bg-red-50 text-red-700',
  initiated:          'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  draft:              'Draft',
  submitted:          'Under review',
  changes_requested:  'Changes requested',
  approved:           'Approved',
  rejected:           'Rejected',
  listed:             'Listed',
  private:            'Private',
  unlisted:           'Unlisted',
  suspended:          'Suspended',
  certified:          'Certified',
  not_certified:      'Not certified',
  verified:           'Verified',
  pending:            'Pending',
  confirmed:          'Confirmed',
  failed:             'Failed',
  initiated:          'Initiated',
};

export function StatusBadge({ status, size = 'sm' }: Props) {
  const styles = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  const label  = STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  const sizeCls = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeCls} ${styles}`}>
      {label}
    </span>
  );
}
