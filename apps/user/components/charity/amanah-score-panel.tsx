// apps/user/components/charity/amanah-score-panel.tsx
// AmanahHub — Amanah Index™ score display panel

interface ScoreHistory { value: number; computedAt: string; }

interface Props {
  latestScore: {
    value: number; version: string; computedAt: string;
    publicSummary: string | null;
    breakdown: Record<string, any> | null;
  } | null;
  history: ScoreHistory[];
}

function gradeInfo(score: number) {
  if (score >= 85) return { label: 'Platinum Amanah', color: 'text-purple-700', bg: 'bg-purple-50' };
  if (score >= 70) return { label: 'Gold Amanah',     color: 'text-amber-600',  bg: 'bg-amber-50' };
  if (score >= 55) return { label: 'Silver Amanah',   color: 'text-gray-600',   bg: 'bg-gray-50' };
  return               { label: 'Building trust',     color: 'text-gray-500',   bg: 'bg-gray-50' };
}

export function AmanahScorePanel({ latestScore, history }: Props) {
  if (!latestScore) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Amanah Index™
        </h3>
        <p className="text-sm text-gray-400">Score not yet computed.</p>
      </div>
    );
  }

  const grade = gradeInfo(latestScore.value);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Amanah Index™
      </h3>

      {/* Score */}
      <div className={`flex items-center gap-4 p-4 rounded-lg ${grade.bg} mb-4`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${grade.color}`}>
            {latestScore.value.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">/ 100</div>
        </div>
        <div>
          <p className={`text-sm font-semibold ${grade.color}`}>{grade.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{latestScore.version}</p>
          <p className="text-xs text-gray-400">
            Updated {new Date(latestScore.computedAt).toLocaleDateString('en-MY')}
          </p>
        </div>
      </div>

      {/* Public summary */}
      {latestScore.publicSummary && (
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          {latestScore.publicSummary}
        </p>
      )}

      {/* Score breakdown */}
      {latestScore.breakdown && (
        <div className="space-y-2">
          {[
            { key: 'governance_score',             label: 'Governance',           weight: '30%' },
            { key: 'financial_transparency_score', label: 'Financial',            weight: '25%' },
            { key: 'project_transparency_score',   label: 'Project transparency', weight: '20%' },
            { key: 'impact_efficiency_score',      label: 'Impact',               weight: '15%' },
            { key: 'feedback_score',               label: 'Feedback',             weight: '10%' },
          ].map(({ key, label, weight }) => {
            const val = latestScore.breakdown?.[key];
            if (val == null) return null;
            const pct = Math.round(val);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs text-gray-400">{pct}/100 <span className="text-gray-300">({weight})</span></span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Score history sparkline — simple text */}
      {history.length > 1 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Score history</p>
          <div className="flex items-end gap-1 h-8">
            {history.slice(0, 8).reverse().map((h, i) => (
              <div key={i} title={`${h.value.toFixed(1)} — ${new Date(h.computedAt).toLocaleDateString('en-MY')}`}
                className="flex-1 bg-emerald-200 rounded-sm"
                style={{ height: `${(h.value / 100) * 32}px` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
