// components/charity/amanah-score-panel.tsx
// AmanahHub — Amanah score sidebar panel (Sprint 7 UI uplift)
// Matches UAT right-column score display: ring + grade + breakdown bars + history sparkline row

import { ScoreRing, scoreTier, tierLabel } from '@/components/ui/score-ring';

interface ScoreEntry {
  score_value:   number | string;
  score_version: string;
  computed_at:   string;
  public_summary?: string | null;
  breakdown?:    Record<string, unknown> | null;
}

interface Props {
  scoreHistory: ScoreEntry[] | null;
}

// Pretty-print breakdown keys
const BREAKDOWN_LABELS: Record<string, string> = {
  governance:   'Governance',
  reporting:    'Reporting',
  financial:    'Financial',
  shariah:      'Shariah',
  engagement:   'Community',
  transparency: 'Transparency',
  compliance:   'Compliance',
  accountability:'Accountability',
};

function formatKey(key: string) {
  return BREAKDOWN_LABELS[key] ??
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AmanahScorePanel({ scoreHistory }: Props) {
  if (!scoreHistory?.length) {
    return (
      <div className="card p-4">
        <p className="sec-label">Amanah score</p>
        <div className="flex flex-col items-center py-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 ring-1 ring-gray-200
                          flex items-center justify-center text-gray-300 text-lg">
            —
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Score not yet published</p>
        </div>
      </div>
    );
  }

  const latest  = scoreHistory[0];
  const score   = Number(latest.score_value);
  const tier    = scoreTier(score);
  const label   = tierLabel(tier);
  const breakdown = latest.breakdown as Record<string, number> | null;

  // History mini-dots (last 5)
  const recent = scoreHistory.slice(0, 5).reverse();

  return (
    <div className="card p-4">
      <p className="sec-label">Amanah score</p>

      {/* Ring + label */}
      <div className="flex flex-col items-center py-3">
        <ScoreRing score={score} size="lg" />
        <p className="text-[11px] text-gray-500 mt-2">
          {label} Amanah · {latest.score_version}
        </p>
      </div>

      {/* Public summary */}
      {latest.public_summary && (
        <p className="text-[11px] text-gray-500 leading-relaxed mb-3 text-center px-1">
          {latest.public_summary}
        </p>
      )}

      {/* Breakdown bars */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="mt-1 space-y-2">
          {Object.entries(breakdown)
            .filter(([, v]) => typeof v === 'number')
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([key, val]) => {
              const pct = Math.min(100, Math.max(0, val as number));
              return (
                <div key={key}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-[10px] text-gray-500">{formatKey(key)}</span>
                    <span className="text-[10px] font-medium text-gray-700">{Math.round(pct)}</span>
                  </div>
                  <div className="prog-wrap">
                    <div className="prog-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* History dots */}
      {recent.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1.5">Score history</p>
          <div className="flex items-end gap-1.5">
            {recent.map((entry, i) => {
              const s  = Number(entry.score_value);
              const h  = Math.max(8, Math.round((s / 100) * 28));
              const t  = scoreTier(s);
              const bg =
                t === 'platinum' ? 'bg-violet-400' :
                t === 'gold'     ? 'bg-amber-400'  : 'bg-gray-300';
              return (
                <div key={i} className="flex flex-col items-center gap-0.5" title={`${Math.round(s)} — ${new Date(entry.computed_at).getFullYear()}`}>
                  <div className={`w-3.5 rounded-sm ${bg}`} style={{ height: `${h}px` }} />
                  <span className="text-[8px] text-gray-400">
                    {new Date(entry.computed_at).getFullYear().toString().slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
