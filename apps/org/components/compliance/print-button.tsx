'use client';
// apps/org/components/compliance/print-button.tsx
export function PrintButton() {
  return (
    <button
      type="button"
      className="print-btn"
      onClick={() => window.print()}>
      🖨 Print / Save as PDF
    </button>
  );
}
