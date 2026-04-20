import Link from 'next/link';
import { ScoreRing } from '@/components/ui/score-ring';
import { CertifiedBadge, TierBadge } from '@/components/ui/badge';
import { GovernanceStageBadge } from '@/components/charity/governance-stage-badge';
import { TrustBadgeInline } from '@/components/charity/trust-badge';
import {
  type PublicTrustProfile,
  canShowTrustScore,
  getDirectoryStageMeta,
  getPublicProfileSummary,
  orgTypeLabel,
} from '@/lib/public-trust';
import { getTrustGrade } from '@/lib/trust';

export function CharityCard({ org }: { org: PublicTrustProfile }) {
  const hasScore = canShowTrustScore(org);
  const score = org.trust_score ?? 0;
  const trustGrade = hasScore ? getTrustGrade(score) : null;
  const isCertified = org.snapshot_status === 'published' && org.review_status === 'approved';
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const summary = getPublicProfileSummary(org) ?? stageMeta.description;

  return (
    <Link
      href={`/charities/${org.organization_id}`}
      className="group block overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-white p-5">
        <div className="mb-3 flex items-start gap-4">
          {hasScore ? (
            <ScoreRing score={score} size="lg" showLabel />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Amanah
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <GovernanceStageBadge stage={org.governance_stage_key} />
              {isCertified ? <CertifiedBadge /> : null}
              {hasScore ? <TierBadge score={score} /> : null}
            </div>

            <h3 className="mt-3 line-clamp-2 text-[18px] font-semibold leading-snug text-gray-900 transition group-hover:text-emerald-800">
              {org.name}
            </h3>

            <p className="mt-1 text-[12px] text-gray-500">
              {orgTypeLabel(org.org_type) ?? 'Organisation'}
              {org.state ? ` · ${org.state}` : ''}
            </p>
          </div>
        </div>

        {trustGrade ? (
          <TrustBadgeInline
            score={score}
            grade={trustGrade.grade}
            gradeLabel={trustGrade.label}
          />
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            Building public trust profile
          </span>
        )}
      </div>

      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Why donors may consider this organisation
        </p>

        <p className="mt-3 line-clamp-4 text-[13px] leading-7 text-gray-600">
          {summary}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniFact
            label="Trust score"
            value={hasScore ? `${Math.round(score)}/100` : 'In progress'}
          />
          <MiniFact
            label="Public profile"
            value={org.snapshot_status === 'published' ? 'Published' : 'Building'}
          />
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-[12px] text-gray-500">{org.governance_stage_label ?? stageMeta.label}</span>
          <span className="text-[13px] font-semibold text-emerald-700 transition group-hover:translate-x-0.5">
            View charity →
          </span>
        </div>
      </div>
    </Link>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-gray-900">{value}</p>
    </div>
  );
}
