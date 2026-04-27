import Link from 'next/link';
import {
  type PublicTrustProfile,
  canShowTrustScore,
  getDirectoryStageMeta,
  getPublicProfileSummary,
  orgTypeLabel,
} from '@/lib/public-trust';
import { getTrustGrade } from '@/lib/trust';

type CompactGrade = 'platinum' | 'gold' | 'silver' | 'bronze' | 'foundation' | 'none' | string;
type TrustPillVariant = 'status' | 'certified' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'foundation' | 'none';

export function CharityCard({ org }: { org: PublicTrustProfile }) {
  const hasScore = canShowTrustScore(org);
  const score = Number(org.amanah_index_score ?? 0);
  const trustGrade = hasScore ? getTrustGrade(score) : null;
  const isCertified = org.snapshot_status === 'published' && org.review_status === 'approved';
  const stageMeta = getDirectoryStageMeta(org.governance_stage_key);
  const summary = getPublicProfileSummary(org) ?? stageMeta.description;
  const displayOrgType = orgTypeLabel(org.org_type) ?? 'Organisation';
  const updatedAt = org.published_at ?? org.public_updated_at ?? org.updated_at;
  const grade = (trustGrade?.grade ?? 'none') as CompactGrade;
  const gradeLabel = trustGrade?.label ?? 'Amanah';
  const maturity = maturityLabel(grade, stageMeta.description);
  const accent = cardAccent(grade);

  return (
    <Link
      href={`/charities/${org.organization_id}`}
      className={`group block h-full overflow-hidden rounded-[28px] border bg-white shadow-sm ring-1 ring-black/[0.02] transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${accent.border}`}
    >
      <div className={`relative overflow-hidden bg-gradient-to-br ${accent.header} p-4 pb-5`}>
        <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${accent.glowOne}`} />
        <div className={`pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full blur-2xl ${accent.glowTwo}`} />

        <div className="relative grid grid-cols-[96px_1fr] items-start gap-4">
          <TrustShieldScore score={hasScore ? score : null} grade={grade} />

          <div className="min-w-0 pt-0.5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <TrustPill variant="status">{statusLabel(org.snapshot_status)}</TrustPill>
              {isCertified ? <TrustPill variant="certified">Certified</TrustPill> : null}
            </div>

            <div className="mt-2 flex justify-center">
              <TrustPill variant={normalizePillVariant(grade)} strong>
                {gradeLabel}
              </TrustPill>
            </div>

            <p className={`mt-2 text-[12px] font-semibold leading-5 ${accent.text}`}>
              {maturity}
            </p>

            <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-900">
              Verified by Amanah Governance Platform
            </p>

            {updatedAt ? (
              <p className="mt-1 text-[12px] leading-5 text-slate-600">
                Updated {formatDate(updatedAt)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 pt-4">
        <h3 className="line-clamp-2 text-[19px] font-extrabold leading-snug tracking-[-0.01em] text-slate-950 transition group-hover:text-emerald-800">
          {org.name}
        </h3>

        <p className="mt-1.5 text-[13px] font-medium leading-5 text-slate-700">
          {displayOrgType}
          {org.state ? (
            <>
              {' '}
              <span aria-hidden="true">&middot;</span>
              {' '}
              {org.state}
            </>
          ) : null}
        </p>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-[13px] font-semibold text-slate-950">
            Why donors may consider this organisation
          </p>

          <p className="mt-3 line-clamp-4 text-[13px] leading-7 text-slate-700">
            {summary}
          </p>
        </div>
      </div>
    </Link>
  );
}

function TrustShieldScore({ score, grade }: { score: number | null; grade: CompactGrade }) {
  const styles = shieldStyles(grade);

  return (
    <div className="relative flex h-[112px] w-[96px] flex-shrink-0 items-start justify-center overflow-hidden rounded-xl bg-white/65 pt-1 shadow-inner ring-1 ring-white/80">
      <svg viewBox="0 0 96 110" aria-hidden="true" className={`h-[106px] w-[92px] drop-shadow-sm ${styles.shield}`}>
        <path
          d="M48 2L87 20V45C87 72 70 95 48 108C26 95 9 72 9 45V20L48 2Z"
          fill="currentColor"
        />
      </svg>

      <div className="absolute inset-x-0 top-[29px] text-center">
        {score && score > 0 ? (
          <span className={`text-[18px] font-semibold leading-none tabular-nums ${styles.score}`}>
            {score.toFixed(1)}
          </span>
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
            Amanah
          </span>
        )}
      </div>
    </div>
  );
}

function TrustPill({
  children,
  variant,
  strong = false,
}: {
  children: React.ReactNode;
  variant: TrustPillVariant;
  strong?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] ring-1 ${strong ? 'font-black uppercase tracking-[0.16em]' : 'font-semibold'} ${pillStyles(variant)}`}
    >
      {children}
    </span>
  );
}

function pillStyles(variant: TrustPillVariant) {
  switch (variant) {
    case 'status':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'certified':
      return 'bg-green-50 text-green-700 ring-green-200';
    case 'platinum':
      return 'bg-slate-100 text-slate-700 ring-slate-300';
    case 'gold':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'silver':
      return 'bg-slate-50 text-slate-600 ring-slate-200';
    case 'bronze':
      return 'bg-orange-50 text-orange-700 ring-orange-200';
    case 'foundation':
      return 'bg-sky-50 text-sky-700 ring-sky-200';
    default:
      return 'bg-slate-50 text-slate-600 ring-slate-200';
  }
}

function normalizePillVariant(grade: CompactGrade): TrustPillVariant {
  if (
    grade === 'platinum' ||
    grade === 'gold' ||
    grade === 'silver' ||
    grade === 'bronze' ||
    grade === 'foundation'
  ) {
    return grade;
  }

  return 'none';
}

function cardAccent(grade: CompactGrade) {
  switch (grade) {
    case 'platinum':
      return {
        border: 'border-slate-200 hover:border-slate-300',
        header: 'from-slate-50 via-white to-slate-100/80',
        glowOne: 'bg-slate-300/25',
        glowTwo: 'bg-emerald-200/18',
        text: 'text-slate-700',
      };
    case 'gold':
      return {
        border: 'border-amber-100/80 hover:border-amber-300',
        header: 'from-amber-50 via-white to-yellow-50/90',
        glowOne: 'bg-amber-300/30',
        glowTwo: 'bg-emerald-200/20',
        text: 'text-amber-700',
      };
    case 'silver':
      return {
        border: 'border-slate-200 hover:border-slate-300',
        header: 'from-slate-50 via-white to-slate-100/80',
        glowOne: 'bg-slate-300/25',
        glowTwo: 'bg-sky-200/20',
        text: 'text-slate-600',
      };
    case 'bronze':
      return {
        border: 'border-orange-100/80 hover:border-orange-300',
        header: 'from-orange-50 via-white to-amber-50/80',
        glowOne: 'bg-orange-300/25',
        glowTwo: 'bg-amber-200/20',
        text: 'text-orange-700',
      };
    case 'foundation':
      return {
        border: 'border-sky-100/80 hover:border-sky-300',
        header: 'from-sky-50 via-white to-emerald-50/70',
        glowOne: 'bg-sky-300/25',
        glowTwo: 'bg-emerald-200/20',
        text: 'text-sky-700',
      };
    default:
      return {
        border: 'border-emerald-100/80 hover:border-emerald-300',
        header: 'from-emerald-50 via-white to-slate-50',
        glowOne: 'bg-emerald-300/20',
        glowTwo: 'bg-slate-200/20',
        text: 'text-emerald-700',
      };
  }
}

function shieldStyles(grade: CompactGrade) {
  switch (grade) {
    case 'platinum':
      return { shield: 'text-slate-300', score: 'text-slate-950' };
    case 'gold':
      return { shield: 'text-amber-400', score: 'text-slate-950' };
    case 'silver':
      return { shield: 'text-slate-300', score: 'text-slate-950' };
    case 'bronze':
      return { shield: 'text-orange-400', score: 'text-slate-950' };
    case 'foundation':
      return { shield: 'text-sky-300', score: 'text-slate-950' };
    default:
      return { shield: 'text-emerald-100', score: 'text-emerald-800' };
  }
}

function statusLabel(status: string | null | undefined) {
  if (status === 'published') return 'Published trust profile';
  if (status === 'draft') return 'Trust profile in progress';
  if (status === 'archived') return 'Archived trust profile';
  return 'Public organisation profile';
}

function maturityLabel(grade: CompactGrade | undefined, fallback: string) {
  switch (grade) {
    case 'platinum':
      return 'Exceptional governance maturity';
    case 'gold':
      return 'Strong governance maturity';
    case 'silver':
      return 'Established governance maturity';
    case 'bronze':
      return 'Developing governance maturity';
    case 'foundation':
      return 'Early governance stage';
    default:
      return fallback || 'Building public trust profile';
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}
