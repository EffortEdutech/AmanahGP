// apps/org/components/dashboard/onboarding-widget.tsx
// Sprint 21 — Dashboard onboarding progress widget
//
// Shows when onboarding is not complete.
// Hides automatically once all 7 steps are done.
// Compact — fits naturally above the main dashboard content.

import Link from 'next/link';
import type { OnboardingState } from '@/lib/onboarding-state';

interface Props {
  state: OnboardingState;
  basePath?: string;
}

export function OnboardingWidget({ state, basePath = '' }: Props) {
  // Don't render if complete
  if (state.isComplete) return null;

  const currentStep = state.currentStep;
  const remaining   = state.totalSteps - state.completedCount;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-5">
      <div className="flex items-start gap-4">

        {/* Progress ring */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="22"
              fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <circle cx="28" cy="28" r="22"
              fill="none" stroke="#10b981" strokeWidth="5"
              strokeDasharray={`${(state.pct / 100) * 138.2} 138.2`}
              strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[12px] font-bold text-gray-800">{state.pct}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-bold text-gray-800">
              Amanah Ready — {state.completedCount}/{state.totalSteps} steps done
            </p>
            <Link href={`${basePath}/onboarding`}
              className="text-[11px] font-medium text-blue-600 hover:underline flex-shrink-0">
              View all steps →
            </Link>
          </div>

          {/* Segment strip */}
          <div className="flex gap-1 mt-2">
            {state.steps.map((step) => (
              <div key={step.id}
                title={step.title}
                className={`flex-1 h-1.5 rounded-full ${
                  step.done ? 'bg-emerald-500' : 'bg-gray-200'
                }`} />
            ))}
          </div>

          {/* Current step CTA */}
          {currentStep && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500">
                  Next: <span className="font-medium text-gray-700">{currentStep.title}</span>
                </p>
              </div>
              <Link href={currentStep.ctaHref}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white
                           text-[11px] font-medium rounded-lg transition-colors flex-shrink-0
                           flex items-center gap-1">
                {currentStep.cta}
                {currentStep.trustPts && (
                  <span className="opacity-80">+{currentStep.trustPts}pts</span>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
