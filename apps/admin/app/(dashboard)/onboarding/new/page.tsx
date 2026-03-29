// apps/admin/app/(dashboard)/onboarding/new/page.tsx
// AmanahHub Console — Register new organization (Step 1: Basic Profile)

import { createOrganization } from '../../orgs/actions';
import { OnboardingForm }     from '@/components/org/onboarding-form';

export const metadata = { title: 'Register Organization | AmanahHub Console' };

export default function NewOrgPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Register your organization</h1>
        <p className="mt-2 text-sm text-gray-500">
          Start by providing your organization's basic profile. You will complete governance
          classification in the next step.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <StepBadge number={1} label="Basic profile" active />
        <div className="flex-1 h-px bg-gray-200" />
        <StepBadge number={2} label="Classification" />
        <div className="flex-1 h-px bg-gray-200" />
        <StepBadge number={3} label="Review & submit" />
      </div>

      <OnboardingForm action={createOrganization} />
    </div>
  );
}

function StepBadge({ number, label, active }: { number: number; label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
        ${active ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
        {number}
      </div>
      <span className={`text-sm ${active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}
