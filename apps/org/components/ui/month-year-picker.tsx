'use client';
// apps/org/components/ui/month-year-picker.tsx
// amanahOS — Month / Year Picker
//
// A compact, elegant picker that replaces the inline button rows.
// Opens a small popover with year navigation + month grid.
// Uses URL-based navigation (pushes ?year=&month= to current path).
// No external dependencies — pure React + Tailwind.
//
// Usage:
//   <MonthYearPicker
//     selectedYear={2026}
//     selectedMonth={4}          // optional — null = all months
//     basePath="/accounting/transactions"
//     extraParams="&fundId=abc"  // optional
//     allowAllMonths             // shows "All months" option
//   />

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL  = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

interface Props {
  selectedYear:    number;
  selectedMonth?:  number | null;   // 1–12, or null = all
  basePath:        string;          // e.g. "/accounting/transactions"
  extraParams?:    string;          // e.g. "&fundId=abc" — appended after year/month
  allowAllMonths?: boolean;         // show "All" option
  label?:          string;          // override button label
}

export function MonthYearPicker({
  selectedYear,
  selectedMonth,
  basePath,
  extraParams = '',
  allowAllMonths = false,
  label,
}: Props) {
  const router   = useRouter();
  const [open,   setOpen]      = useState(false);
  const [viewY,  setViewY]     = useState(selectedYear);
  const ref      = useRef<HTMLDivElement>(null);

  const now         = new Date();
  const currentYear = now.getFullYear();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Sync view year when prop changes
  useEffect(() => { setViewY(selectedYear); }, [selectedYear]);

  const navigate = useCallback((year: number, month: number | null) => {
    let url = `${basePath}?year=${year}`;
    if (month) url += `&month=${month}`;
    if (extraParams) url += extraParams;
    router.push(url);
    setOpen(false);
  }, [basePath, extraParams, router]);

  // Button label
  const displayLabel = label
    ?? (selectedMonth
      ? `${MONTHS_SHORT[selectedMonth - 1]} ${selectedYear}`
      : `${selectedYear}`);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[13px] font-medium
          transition-all duration-150 select-none
          ${open
            ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
          }
        `}>
        <CalendarIcon />
        <span>{displayLabel}</span>
        <ChevronIcon open={open} />
      </button>

      {/* Popover */}
      {open && (
        <div className="
          absolute z-50 top-full mt-2 left-0
          w-64 bg-white rounded-xl border border-gray-200
          shadow-xl shadow-gray-900/10
          animate-in
        ">
          {/* Year navigation row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setViewY((y) => y - 1)}
              disabled={viewY <= currentYear - 3}
              className="w-7 h-7 flex items-center justify-center rounded-md
                         text-gray-400 hover:text-gray-700 hover:bg-gray-100
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ‹
            </button>
            <span className="text-[14px] font-semibold text-gray-800">{viewY}</span>
            <button
              type="button"
              onClick={() => setViewY((y) => y + 1)}
              disabled={viewY >= currentYear}
              className="w-7 h-7 flex items-center justify-center rounded-md
                         text-gray-400 hover:text-gray-700 hover:bg-gray-100
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ›
            </button>
          </div>

          {/* Month grid */}
          <div className="p-3 grid grid-cols-4 gap-1">
            {MONTHS_SHORT.map((m, i) => {
              const monthNum  = i + 1;
              const isSelected = viewY === selectedYear && selectedMonth === monthNum;
              const isCurrent  = viewY === currentYear && monthNum === now.getMonth() + 1;
              const isFuture   = viewY === currentYear && monthNum > now.getMonth() + 1;

              return (
                <button
                  key={m}
                  type="button"
                  disabled={isFuture}
                  onClick={() => navigate(viewY, monthNum)}
                  title={MONTHS_FULL[i]}
                  className={`
                    relative h-9 rounded-lg text-[12px] font-medium transition-all
                    ${isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : isFuture
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}>
                  {m}
                  {isCurrent && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2
                                     w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* All months + full year options */}
          <div className="px-3 pb-3 space-y-1 border-t border-gray-100 pt-2">
            {allowAllMonths && (
              <button
                type="button"
                onClick={() => navigate(viewY, null)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors
                  ${!selectedMonth && viewY === selectedYear
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }
                `}>
                All months — {viewY}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                let url = `${basePath}?year=${viewY}`;
                if (extraParams) url += extraParams;
                router.push(url);
                setOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors
                ${!selectedMonth && viewY === selectedYear
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }
              `}>
              Full year view — {viewY}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      className="text-gray-400 flex-shrink-0">
      <rect x="1" y="3" width="14" height="12" rx="2"
        stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1v4M11 1v4M1 7h14"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      className={`text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
