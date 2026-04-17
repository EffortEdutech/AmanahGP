import { ConsoleShell } from "@/components/console-shell";

export default function PlansPage() {
  return (
    <ConsoleShell title="Plans">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-slate-900">Plan management</div>
        <div className="mt-2 text-sm text-slate-500">
          This page will later define trial, basic, growth, and enterprise subscriptions.
        </div>
      </div>
    </ConsoleShell>
  );
}
