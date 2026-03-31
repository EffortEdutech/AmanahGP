// components/charity/charity-card.tsx
// AmanahHub — Charity directory card (Sprint 7 UI uplift)
// Matches UAT s-dir card: score ring + org name + type/state + badges + summary

import Link                           from 'next/link';
import { ScoreRing, scoreTier }       from '@/components/ui/score-ring';
import { CertifiedBadge, TierBadge }  from '@/components/ui/badge';

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo:              'NGO / Welfare',
  mosque_surau:     'Mosque / Surau',
  waqf_institution: 'Waqf Institution',
  zakat_body:       'Zakat Body',
  foundation:       'Foundation',
  cooperative:      'Cooperative',
  other:            'Other',
};

export interface CharityCardOrg {
  id:                   string;
  name:                 string;
  summary:              string | null;
  org_type:             string | null;
  state:                string | null;
  certification_status: string | null;
  amanah_score:         number | null;
}

export function CharityCard({ org }: { org: CharityCardOrg }) {
  const isCertified = org.certification_status === 'certified';
  const hasScore    = org.amanah_score !== null && org.amanah_score > 0;

  return (
    <Link
      href={`/charities/${org.id}`}
      className="card p-4 block hover:border-emerald-200 hover:shadow-sm transition-all"
    >
      {/* Top row: score ring + org info */}
      <div className="flex items-start gap-3 mb-2.5">
        {hasScore ? (
          <ScoreRing score={org.amanah_score!} size="md" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 ring-1 ring-gray-200
                          flex items-center justify-center text-gray-300 text-xs flex-shrink-0">
            —
          </div>
        )}

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[13px] font-semibold text-gray-900 leading-snug mb-0.5 truncate">
            {org.name}
          </p>
          <p className="text-[11px] text-gray-500 mb-1.5">
            {org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : ''}
            {org.state ? ` · ${org.state}` : ''}
          </p>

          {/* Badges */}
          {(isCertified || hasScore) && (
            <div className="flex flex-wrap gap-1">
              {isCertified && <CertifiedBadge />}
              {hasScore && <TierBadge score={org.amanah_score!} />}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {org.summary && (
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
          {org.summary}
        </p>
      )}
    </Link>
  );
}
