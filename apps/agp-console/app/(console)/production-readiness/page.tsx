import { ConsoleShell } from "@/components/console-shell";
import { ProductionReadinessBoard } from "@/components/production-readiness-board";
import { requireConsoleAccess } from "@/lib/console/access";
import {
  getConsoleCriticalFlow,
  getConsoleUatChecklist,
  getProductionReadinessSummary,
} from "@/lib/console/production-readiness";

export default async function ProductionReadinessPage() {
  const { user, roles } = await requireConsoleAccess("audit.read");
  const [summary, flow, checklist] = await Promise.all([
    getProductionReadinessSummary(),
    Promise.resolve(getConsoleCriticalFlow()),
    Promise.resolve(getConsoleUatChecklist()),
  ]);

  return (
    <ConsoleShell
      title="Production Readiness"
      description="Final UAT checkpoint, locked navigation map, and production launch verification board for AGP Console."
      currentPath="/production-readiness"
      roles={roles}
      userEmail={user.email}
    >
      <ProductionReadinessBoard summary={summary} flow={flow} checklist={checklist} />
    </ConsoleShell>
  );
}
