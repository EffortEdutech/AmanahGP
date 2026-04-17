import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { setAppInstallationAction } from "@/app/(console)/organisations/[orgId]/apps/actions";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import { getOrganizationById, listAvailableApps, listOrganizationInstallations } from "@/lib/console/server";

export default async function OrganizationAppsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { orgId } = await params;
  const { error } = await searchParams;
  const { user, roles } = await requireConsoleAccess("apps.read");
  const organization = await getOrganizationById(orgId);
  const [catalog, installations] = await Promise.all([listAvailableApps(), listOrganizationInstallations(orgId)]);
  const installationMap = new Map(installations.map((item: any) => [item.app?.id, item]));

  return (
    <ConsoleShell
      title={`Apps — ${organization.legal_name ?? organization.name}`}
      description="Provision apps and features per organisation through public.app_catalog and public.app_installations."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      <div className="row">
        <Link className="btn btn-secondary" href={`/organisations/${orgId}`}>Back to organisation</Link>
      </div>

      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

      <section className="panel section stack">
        <div className="h2">App catalog</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>App</th>
                <th>Catalog status</th>
                <th>Installation</th>
                <th>Installed at</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((app: any) => {
                const installation = installationMap.get(app.id);
                const status = installation?.status ?? "not_installed";
                const nextStatus = installation?.status === "enabled" ? "disabled" : "enabled";
                const buttonLabel = installation?.status === "enabled" ? "Disable" : installation?.status === "disabled" ? "Enable" : "Install";
                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{app.app_name}</div>
                      <div className="muted">{app.app_key}</div>
                      <div className="muted">{app.description || "—"}</div>
                    </td>
                    <td><span className={statusBadgeClass(app.status)}>{titleCase(app.status)}</span></td>
                    <td><span className={statusBadgeClass(status)}>{titleCase(status)}</span></td>
                    <td>{formatDateTime(installation?.installed_at)}</td>
                    <td>
                      <form action={setAppInstallationAction}>
                        <input type="hidden" name="org_id" value={orgId} />
                        <input type="hidden" name="app_id" value={app.id} />
                        <input type="hidden" name="next_status" value={nextStatus} />
                        <button className="btn btn-secondary" type="submit">{buttonLabel}</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </ConsoleShell>
  );
}
