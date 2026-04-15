// apps/user/components/ui/trust-panel.tsx
// AmanahHub — Trust Snapshot Panel + Pillar Breakdown
// Sprint 24
//
// Two sub-components:
//   TrustSnapshotPanel — 5 governance signals answering donor fears
//   TrustPillarPanel   — 5 pillar progress bars with public-friendly labels

interface SnapshotSignal {
  label:  string;
  detail: string;
  ok:     boolean;
}

interface PillarData {
  key:         string;
  publicLabel: string;
  pct:         number;
}

interface TrustSnapshotPanelProps {
  signals:    SnapshotSignal[];
  orgName:    string;
}

interface TrustPillarPanelProps {
  pillars: PillarData[];
}

// ── Snapshot: "Why this org is trusted" ─────────────────────
export function TrustSnapshotPanel({ signals, orgName }: TrustSnapshotPanelProps) {
  const passedCount = signals.filter((s) => s.ok).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-gray-700">
          Why {orgName} is trusted
        </p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          passedCount >= 4 ? 'bg-emerald-100 text-emerald-700' :
          passedCount >= 2 ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {passedCount}/{signals.length} signals
        </span>
      </div>

      <div className="space-y-2.5">
        {signals.map((signal) => (
          <div key={signal.label}
            className={`flex items-start gap-3 p-3 rounded-lg ${
              signal.ok ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50 border border-gray-100'
            }`}>
            <span className={`flex-shrink-0 mt-0.5 text-sm ${
              signal.ok ? 'text-emerald-500' : 'text-gray-300'
            }`}>
              {signal.ok ? '✓' : '○'}
            </span>
            <div>
              <p className={`text-[12px] font-medium ${
                signal.ok ? 'text-emerald-800' : 'text-gray-500'
              }`}>
                {signal.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                {signal.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Governance signals are derived from live operational data — not self-reported.
        This is what makes Amanah verification meaningful.
      </p>
    </div>
  );
}

// ── Pillar breakdown: 5 progress bars ────────────────────────
export function TrustPillarPanel({ pillars }: TrustPillarPanelProps) {
  const PILLAR_COLORS: Record<string, string> = {
    financial_integrity: 'bg-emerald-500',
    governance:          'bg-blue-500',
    compliance:          'bg-purple-500',
    transparency:        'bg-teal-500',
    impact:              'bg-amber-500',
  };

  const PILLAR_ICONS: Record<string, string> = {
    financial_integrity: '💰',
    governance:          '⚖',
    compliance:          '☑',
    transparency:        '◎',
    impact:              '🌱',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      <p className="text-[12px] font-semibold text-gray-700">Trust pillar breakdown</p>

      <div className="space-y-3">
        {pillars.map((p) => (
          <div key={p.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-gray-600 flex items-center gap-1.5">
                <span>{PILLAR_ICONS[p.key] ?? '•'}</span>
                {p.publicLabel}
              </span>
              <span className="text-[11px] font-semibold text-gray-700">
                {Math.round(p.pct)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  PILLAR_COLORS[p.key] ?? 'bg-gray-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, p.pct))}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400">
        Scores are computed from real accounting records and governance activities
        — updated continuously as the organisation operates on the platform.
      </p>
    </div>
  );
}

// ── Mini trust panel for donation page ───────────────────────
interface MiniTrustPanelProps {
  signals:    SnapshotSignal[];
  gradeLabel: string;
  score:      number;
}

export function MiniTrustPanel({ signals, gradeLabel, score }: MiniTrustPanelProps) {
  const passed = signals.filter((s) => s.ok);

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-emerald-600">🛡</span>
        <p className="text-[12px] font-semibold text-emerald-800">
          {gradeLabel} Amanah · Score {score.toFixed(1)}/100
        </p>
      </div>

      <div className="space-y-1.5">
        {passed.slice(0, 4).map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-emerald-500 text-sm flex-shrink-0">✓</span>
            <p className="text-[11px] text-emerald-700">{s.label}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-emerald-600 italic">
        "Your donation goes to a verified, transparent organisation."
      </p>
    </div>
  );
}
