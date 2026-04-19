import { ConsoleShell } from "@/components/console-shell";
import { PublicationCommandTable } from "@/components/publication-command-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getPublicationCommandSummary, listPublicationCommandRows } from "@/lib/console/publication-command";

export default async function PublicationCommandPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [rows, summary] = await Promise.all([
    listPublicationCommandRows(),
    getPublicationCommandSummary(),
  ]);

  return (
    <ConsoleShell
      title="Publication Command Center"
      description="Final donor-facing release gate for trust snapshots before they appear in public trust profiles and AmanahHub."
      currentPath="/publication-command"
      roles={roles}
      userEmail={user.email}
    >
      {query.message ? <div className="notice">{decodeURIComponent(query.message)}</div> : null}
      {query.error ? <div className="notice notice-warning">{decodeURIComponent(query.error)}</div> : null}

      <section className="grid-cards">
        <StatsCard label="total orgs" value={summary.total_organizations} note="Canonical organisations" />
        <StatsCard label="currently live" value={summary.currently_live} note="Public donor-facing profiles" />
        <StatsCard label="ready to publish" value={summary.ready_to_publish} note="Drafts that pass the release gate" />
        <StatsCard label="blocked drafts" value={summary.blocked_drafts} note="Has draft but still blocked" />
        <StatsCard label="no draft" value={summary.without_draft} note="Nothing available to publish" />
        <StatsCard label="no AmanahHub" value={summary.without_amanah_hub} note="Cannot appear in donor app" />
      </section>

      <section className="panel section stack">
        <div className="h2">Release gate</div>
        <div className="muted">
          Publish only when the organisation is listed, the workspace is active, AmanahHub is enabled, the trust snapshot is donor-safe, and no open governance case is blocking release.
        </div>
        <PublicationCommandTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
