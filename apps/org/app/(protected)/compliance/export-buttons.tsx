// apps/org/app/(protected)/compliance/export-buttons.tsx
// Sprint 26 — Export buttons component (client, for use in compliance page)
'use client';

export function ExportButton({ type, label }: { type: string; label: string }) {
  return (
    <a
      href={`/compliance/export/${type}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium
                 border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-lg
                 hover:bg-emerald-100 transition-colors">
      ↓ Export {label}
    </a>
  );
}
