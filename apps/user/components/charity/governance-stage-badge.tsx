interface GovernanceStageBadgeProps {
  stage?: string | null;
}

const STAGE_LABELS: Record<string, string> = {
  public_profile: 'Public profile',
  listed: 'Listed',
  building: 'Building trust',
  in_review: 'In review',
  under_review: 'Under review',
  clarification: 'Clarification',
  remediation: 'Improvement in progress',
  approved: 'Approved',
  published: 'Published',
};

const STAGE_CLASSES: Record<string, string> = {
  public_profile: 'bg-sky-50 text-sky-700 ring-sky-200',
  listed: 'bg-sky-50 text-sky-700 ring-sky-200',
  building: 'bg-slate-50 text-slate-700 ring-slate-200',
  in_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  under_review: 'bg-amber-50 text-amber-700 ring-amber-200',
  clarification: 'bg-orange-50 text-orange-700 ring-orange-200',
  remediation: 'bg-violet-50 text-violet-700 ring-violet-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  published: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

function normalizeStage(stage?: string | null) {
  return String(stage ?? 'building').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function titleCase(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function GovernanceStageBadge({ stage }: GovernanceStageBadgeProps) {
  const key = normalizeStage(stage);
  const label = STAGE_LABELS[key] ?? titleCase(key);
  const classes = STAGE_CLASSES[key] ?? 'bg-slate-50 text-slate-700 ring-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${classes}`}
      title={`Governance stage: ${label}`}
    >
      {label}
    </span>
  );
}
