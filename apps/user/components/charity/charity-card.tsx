import Link from 'next/link';
import { ScoreRing } from '@/components/ui/score-ring';
import { CertifiedBadge, TierBadge } from '@/components/ui/badge';
import { GovernanceStageBadge } from '@/components/charity/governance-stage-badge';
import { getDirectoryStageMeta, orgTypeLabel } from '@/lib/public-trust';

export interface CharityCardOrg {
  id: string;
  name: string;
  summary: string | null;
  org_type: string | null;
  state: string | null;
  certification_status: string | null;
  amanah_score: number | null;
  governance_stage_key: string | null;
  governance_stage_label: string | null;
  governance_stage_description: string | null;
}

export function CharityCard({ org }: { org: CharityCardOrg }) {
  const isCertified = org.certification_status === 'certified';
  const hasScore = org.amanah_score !== null && org.amanah_score > 0;
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);

  return (
    <Link
      href={`/charities/${org.id}`}
      className="card block p-4 transition-all hover:border-emerald-200 hover:shadow-sm"
    >
      <div className="mb-2.5 flex items-start gap-3">
        {hasScore ? (
          <ScoreRing score={org.amanah_score!} size="md" />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
            Amanah
          </div>
        )}

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="mb-0.5 truncate text-[13px] font-semibold leading-snug text-gray-900">{org.name}</p>
          <p className="mb-1.5 text-[11px] text-gray-500">
            {orgTypeLabel(org.org_type) ?? 'Organisation'}
            {org.state ? ` · ${org.state}` : ''}
          </p>

          <div className="flex flex-wrap gap-1">
            <GovernanceStageBadge stage={org.governance_stage_key} />
            {isCertified && <CertifiedBadge />}
            {hasScore && <TierBadge score={org.amanah_score!} />}
          </div>
        </div>
      </div>

      <p className="mb-1 text-[11px] font-medium text-slate-700">{org.governance_stage_label ?? stageMeta.label}</p>

      {(org.summary ?? org.governance_stage_description) && (
        <p className="line-clamp-3 text-[11px] leading-relaxed text-gray-500">
          {org.summary ?? org.governance_stage_description ?? stageMeta.description}
        </p>
      )}
    </Link>
  );
}
