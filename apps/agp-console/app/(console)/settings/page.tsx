import { ConsoleShell } from "@/components/console-shell";

export default function SettingsPage() {
  return (
    <ConsoleShell title="Settings">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-slate-900">Platform settings</div>
        <div className="mt-2 text-sm text-slate-500">
          Branding, system controls, and environment-level settings will be managed here.
        </div>
      </div>
    </ConsoleShell>
  );
}
