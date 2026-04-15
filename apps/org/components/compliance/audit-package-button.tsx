'use client';
// apps/org/components/compliance/audit-package-button.tsx
// Sprint 29 — Triggers the /api/audit-package download

import { useState } from 'react';

export function AuditPackageButton() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleDownload() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/audit-package');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Download failed (${res.status})`);
      }
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement('a');
      const filename = res.headers.get('content-disposition')
        ?.match(/filename="([^"]+)"/)?.[1] ?? 'amanah-audit-package.zip';
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleDownload}
        className="flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800
                   text-white text-[13px] font-semibold rounded-xl transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
        {loading ? (
          <><span className="animate-spin inline-block">⟳</span> Generating package…</>
        ) : (
          <><span>⬇</span> Download audit package (.zip)</>
        )}
      </button>
      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <p className="text-[10px] text-gray-400">
        Includes: audit PDF (printable, signable) + financial JSON + trust events + org profile
      </p>
    </div>
  );
}
