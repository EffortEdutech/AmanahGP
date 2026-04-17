import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/organisations", label: "Organisations" },
  { href: "/plans", label: "Plans" },
  { href: "/audit-log", label: "Audit Log" },
  { href: "/settings", label: "Settings" },
];

export function ConsoleSidebar() {
  return (
    <aside className="brand-panel flex w-72 flex-col text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/40 bg-white/10 text-sm font-semibold text-amber-200 shadow-sm">
            AGP
          </div>
          <div>
            <div className="font-display text-lg font-bold tracking-tight">AGP Console</div>
            <div className="text-xs text-emerald-100/80">Platform Control Plane</div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-300/15 bg-white/5 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-100/70">
            Workspace
          </div>
          <div className="mt-1 text-sm font-medium text-white">Amanah Governance Platform</div>
          <div className="mt-2 inline-flex rounded-full border border-amber-300/30 bg-amber-50/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
            Theme aligned with Amanah family
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-sm font-medium text-emerald-50/90 transition hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4 text-xs text-emerald-100/75">
        Bismillah — build with amanah.
      </div>
    </aside>
  );
}
