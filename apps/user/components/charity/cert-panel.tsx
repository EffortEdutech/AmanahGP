// components/charity/cert-panel.tsx
// AmanahHub — Certification sidebar panel (Sprint 7 UI uplift)
// Matches UAT right-column cert display: status + validity + grade + CTCF score

import { CertifiedBadge, StatusBadge } from '@/components/ui/badge';

interface CertEntry {
  new_status: string;
  valid_from: string | null;
  valid_to:   string | null;
  decided_at: string;
}

interface EvalEntry {
  total_score:     number | string;
  criteria_version: string;
  computed_at:     string;
}

interface Props {
  certHistory: CertEntry[] | null;
  latestEval:  EvalEntry | null;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
}

function gradeFromScore(score: number) {
  if (score >= 85) return 'Platinum';
  if (score >= 70) return 'Gold';
  if (score >= 55) return 'Silver';
  return 'Basic';
}

export function CertPanel({ certHistory, latestEval }: Props) {
  const latest = certHistory?.[0];
  const isCert = latest?.new_status === 'certified';
  const score  = latestEval ? Number(latestEval.total_score) : null;

  return (
    <div className="card p-4">
      <p className="sec-label">Certification</p>

      {/* Status row */}
      <div className="flex items-center gap-2 mb-3">
        {isCert ? (
          <CertifiedBadge />
        ) : (
          <StatusBadge status={latest?.new_status ?? 'not_certified'} />
        )}
        {score !== null && (
          <span className="text-[10px] text-gray-500 ml-auto">
            {gradeFromScore(score)} Amanah
          </span>
        )}
      </div>

      {/* Validity */}
      {latest && (
        <div className="space-y-1.5 mb-3">
          <Row label="Status"    value={latest.new_status.replace('_', ' ')} />
          {isCert && (
            <>
              <Row label="Valid from" value={fmtDate(latest.valid_from)} />
              <Row label="Valid to"   value={fmtDate(latest.valid_to)} />
            </>
          )}
          <Row label="Decided"   value={fmtDate(latest.decided_at)} />
        </div>
      )}

      {/* CTCF score */}
      {score !== null && (
        <div className="border-t border-gray-100 pt-3 mt-1">
          <p className="text-[10px] text-gray-400 mb-1">CTCF evaluation</p>
          <div className="flex items-end gap-2">
            <span className="stat-val text-[18px]">{Math.round(score)}</span>
            <span className="text-[10px] text-gray-500 mb-0.5">
              / 100 · {latestEval?.criteria_version}
            </span>
          </div>
          {/* CTCF bar */}
          <div className="prog-wrap mt-1.5">
            <div className="prog-fill" style={{ width: `${Math.min(100, score)}%` }} />
          </div>
        </div>
      )}

      {!latest && !latestEval && (
        <p className="text-[11px] text-gray-400">No certification on record.</p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-[10px] text-gray-400">{label}</span>
      <span className="text-[10px] text-gray-700 font-medium capitalize">{value}</span>
    </div>
  );
}
