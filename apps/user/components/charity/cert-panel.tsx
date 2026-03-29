// apps/user/components/charity/cert-panel.tsx
// AmanahHub — CTCF certification status panel

interface Props {
  latestCert: {
    status: string; validFrom: string | null;
    validTo: string | null; decidedAt: string;
  } | null;
  evaluation: {
    totalScore: number; version: string; computedAt: string;
  } | null;
}

const CERT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  certified:     { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✓' },
  not_certified: { bg: 'bg-gray-50',    text: 'text-gray-500',    icon: '○' },
  suspended:     { bg: 'bg-red-50',     text: 'text-red-600',     icon: '⚠' },
};

const CERT_LABELS: Record<string, string> = {
  certified:     'CTCF Certified',
  not_certified: 'Not certified',
  suspended:     'Certification suspended',
};

export function CertPanel({ latestCert, evaluation }: Props) {
  if (!latestCert) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Certification
        </h3>
        <p className="text-sm text-gray-400">No certification on record.</p>
      </div>
    );
  }

  const style = CERT_STYLES[latestCert.status] ?? CERT_STYLES.not_certified;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        CTCF Certification
      </h3>

      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${style.bg} mb-3`}>
        <span className={`text-lg ${style.text}`}>{style.icon}</span>
        <div>
          <p className={`text-sm font-semibold ${style.text}`}>
            {CERT_LABELS[latestCert.status]}
          </p>
          {latestCert.validTo && (
            <p className="text-xs text-gray-400 mt-0.5">
              Valid until {new Date(latestCert.validTo).toLocaleDateString('en-MY')}
            </p>
          )}
        </div>
      </div>

      {evaluation && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Evaluation score</span>
          <span className="font-semibold text-gray-800">
            {evaluation.totalScore.toFixed(1)} / 100
          </span>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        Decided {new Date(latestCert.decidedAt).toLocaleDateString('en-MY')}
      </p>
    </div>
  );
}
