// apps/org/app/(protected)/reports/page.tsx
import { ComingSoonModule } from '@/components/ui/coming-soon-module';
export const metadata = { title: 'Reports — amanahOS' };
export default function ReportsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Submit progress reports and upload evidence</p>
      </div>
      <ComingSoonModule
        label="Reports"
        sprintTarget="Sprint 18"
        description="Report submission migrates from AmanahHub Console in Sprint 18. Use Console to submit reports until then."
        consoleLink
      />
    </div>
  );
}
