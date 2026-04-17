import { ConsoleShell } from "@/components/console-shell";

export default function AuditLogPage() {
  return (
    <ConsoleShell title="Audit Log">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-slate-900">Global audit trail</div>
        <div className="mt-2 text-sm text-slate-500">
          Console actions like org creation, role changes, and plan updates will appear here.
        </div>
      </div>
    </ConsoleShell>
  );
}
