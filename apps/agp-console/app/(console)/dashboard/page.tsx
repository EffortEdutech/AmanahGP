import { ConsoleShell } from "@/components/console-shell";
import { getDashboardStats } from "@/lib/console/server";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: "Total Organisations",
      value: String(stats.totalOrganisations),
      note: "All registered organisations",
    },
    {
      label: "Active Organisations",
      value: String(stats.activeOrganisations),
      note: "Ready and active on platform",
    },
    {
      label: "Draft Organisations",
      value: String(stats.draftOrganisations),
      note: "Created but not fully activated",
    },
    {
      label: "Suspended Organisations",
      value: String(stats.suspendedOrganisations),
      note: "Temporarily restricted",
    },
  ];

  return (
    <ConsoleShell title="Dashboard">
      <section className="mb-6 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-100/80">
            Control plane overview
          </div>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">
            Live Console metrics are now connected.
          </h2>
          <p className="mt-3 text-sm leading-6 text-emerald-50/85">
            The dashboard now reads real data from your Console tables in Supabase.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</div>
            <div className="mt-2 text-sm text-slate-500">{card.note}</div>
          </div>
        ))}
      </div>
    </ConsoleShell>
  );
}
