// apps/org/app/(protected)/policy-kit/page.tsx
// amanahOS — Governance Policy Kit (Sprint 17)
// Renamed from /governance to /policy-kit to avoid confusion with the sidebar section label.

import { ComingSoonModule } from '@/components/ui/coming-soon-module';

export const metadata = { title: 'Policy kit — amanahOS' };

const POLICY_TEMPLATES = [
  'Financial control policy',
  'Procurement policy',
  'Conflict of interest policy',
  'Donation handling SOP',
  'Zakat distribution SOP',
  'Waqf governance SOP',
  'Data protection policy (PDPA)',
  'Shariah governance framework',
];

export default function PolicyKitPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Governance policy kit</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ready-made governance templates. Fill and upload to boost your Amanah score.
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {POLICY_TEMPLATES.map((t) => (
          <div key={t} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">⊞</span>
              <span className="text-[12px] text-gray-700">{t}</span>
            </div>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Sprint 17
            </span>
          </div>
        ))}
      </div>
      <ComingSoonModule
        label="Governance policy kit"
        sprintTarget="Sprint 17"
        description="Download templates, fill in your organisation details, upload completed policies. Each approved policy boosts your CTCF Layer 4 governance score."
      />
    </div>
  );
}
