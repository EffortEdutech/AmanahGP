// apps/user/components/charity/charity-card.tsx
// AmanahHub — Charity card for directory listing

import Link from 'next/link';

interface Props {
  org: {
    id:                   string;
    name:                 string;
    summary:              string | null;
    org_type:             string | null;
    state:                string | null;
    certification_status: string | null;
    amanah_score:         number | null;
  };
}

const ORG_TYPE_LABELS: Record<string, string> = {
  ngo:              'NGO',
  mosque_surau:     'Mosque / Surau',
  waqf_institution: 'Waqf Institution',
  zakat_body:       'Zakat Body',
  foundation:       'Foundation',
  cooperative:      'Cooperative',
  other:            'Other',
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? 'bg-purple-50 text-purple-700' :
    score >= 70 ? 'bg-amber-50 text-amber-700' :
    score >= 55 ? 'bg-gray-100 text-gray-600' :
                  'bg-gray-100 text-gray-400';
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${color} flex-shrink-0`}>
      <span className="text-lg font-bold leading-none">{score.toFixed(0)}</span>
      <span className="text-xs mt-0.5 font-medium">Score</span>
    </div>
  );
}

function CertBadge({ status }: { status: string }) {
  if (status !== 'certified') return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium
                     text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      ✓ Certified
    </span>
  );
}

export function CharityCard({ org }: Props) {
  return (
    <Link href={`/charities/${org.id}`}
      className="flex gap-4 p-5 bg-white rounded-xl border border-gray-200
                 hover:border-emerald-200 hover:shadow-sm transition-all group">

      {/* Score */}
      {org.amanah_score != null && <ScoreBadge score={org.amanah_score} />}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-800
                         leading-snug line-clamp-2">
            {org.name}
          </h2>
          {org.certification_status && (
            <CertBadge status={org.certification_status} />
          )}
        </div>

        <p className="text-xs text-gray-400 mb-2">
          {org.org_type ? ORG_TYPE_LABELS[org.org_type] ?? org.org_type : ''}
          {org.state ? ` · ${org.state}` : ''}
        </p>

        {org.summary && (
          <p className="text-xs text-gray-500 line-clamp-2">{org.summary}</p>
        )}
      </div>
    </Link>
  );
}
