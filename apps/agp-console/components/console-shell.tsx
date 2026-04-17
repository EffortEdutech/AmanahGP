import { getCurrentConsoleRole } from "@/lib/console/server";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { ConsoleSidebar } from "./console-sidebar";

function formatRole(role: string | null) {
  if (!role) return "unassigned";
  return role.replaceAll("_", " ");
}

export async function ConsoleShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = await getCurrentConsoleRole();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <ConsoleSidebar />

        <main className="flex-1">
          <header className="border-b border-emerald-100 bg-white/90 px-8 py-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700/70">
                  Amanah Governance Platform
                </div>
                <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 md:flex">
                  <span>{user?.email ?? "Not signed in"}</span>
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-700">
                    {formatRole(role)}
                  </span>
                </div>
                <LogoutButton />
              </div>
            </div>
          </header>

          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
