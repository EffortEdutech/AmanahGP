import { ConsoleShell } from "@/components/console-shell";
import { FlowMapSection } from "@/components/flow-map-section";
import { requireConsoleAccess } from "@/lib/console/access";
import { CONSOLE_FLOW_SECTIONS } from "@/lib/console/flow-map";

export default async function FlowMapPage() {
  const { user, roles } = await requireConsoleAccess("organizations.read");

  return (
    <ConsoleShell
      title="Console Flow Map"
      description="Mission-focused route map for AGP Console so the governance, approval, publication, and oversight journey is clear and reachable through UI."
      currentPath="/flow-map"
      roles={roles}
      userEmail={user.email}
    >
      <section className="panel section stack">
        <div className="h2">How to use this page</div>
        <div className="muted">
          The left sidebar now follows the AGP Console mission workflow. Use this page as the full reference map for parent pages, child pages, and donor-trust publication routes that are reached from UI actions.
        </div>
      </section>

      {CONSOLE_FLOW_SECTIONS.map((section) => (
        <FlowMapSection key={section.title} section={section} />
      ))}
    </ConsoleShell>
  );
}
