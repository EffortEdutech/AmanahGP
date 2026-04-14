// apps/org/app/(protected)/compliance/page.tsx
import { ComingSoonModule } from '@/components/ui/coming-soon-module';
export const metadata = { title: 'Compliance — amanahOS' };
export default function CompliancePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Compliance reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Auto-generate ROS annual return, MAIN/JAKIM reporting packs, and donor transparency reports
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'ROS annual return', desc: 'Committee list, financial statements, activity report' },
          { label: 'MAIN/JAKIM pack', desc: 'Zakat distribution, asnaf beneficiary, Waqf utilisation' },
          { label: 'Donor transparency', desc: 'Annual report PDF, impact dashboard, governance report' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-[12px] font-semibold text-gray-800">{item.label}</p>
            <p className="text-[11px] text-gray-500 mt-1">{item.desc}</p>
            <span className="mt-2 inline-block text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Sprint 16
            </span>
          </div>
        ))}
      </div>
      <ComingSoonModule
        label="Compliance reports"
        sprintTarget="Sprint 16"
        description="One-click export for Malaysian regulatory reporting packs. Pulls from your fund accounting data and org profile automatically."
      />
    </div>
  );
}
