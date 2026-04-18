import Link from "next/link";
import { Blocks, Settings2 } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { AppProvisioningConfigForm } from "@/components/app-provisioning-config-form";
import { StatsCard } from "@/components/stats-card";
import { setAppInstallationAction, updateAppInstallationConfigAction } from "@/app/(console)/organisations/[orgId]/apps/actions";
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

  const activeCount = installations.filter((item: any) => item.status === "enabled").length;
  const disabledCount = installations.filter((item: any) => item.status === "disabled").length;
  const configuredCount = installations.filter((item: any) => {
    const cfg = item.config ?? {};
    return Boolean(cfg.workspace_slug || cfg.workspace_url || cfg.seats_allocated || (Array.isArray(cfg.feature_flags) && cfg.feature_flags.length > 0));
  }).length;

  return (
    <ConsoleShell
      title={`Apps — ${organization.legal_name ?? organization.name}`}
      description="Provision apps, control installation state, and maintain per-organisation workspace settings using public.app_catalog and public.app_installations only."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      <div className="row">
        <Link className="btn btn-secondary" href={`/organisations/${orgId}`}>Back to organisation</Link>
      </div>

      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

      <section className="grid-cards">
        <StatsCard label="catalog apps" value={catalog.length} note="Apps available to provision" />
        <StatsCard label="enabled" value={activeCount} note="Currently active for this organisation" />
        <StatsCard label="disabled" value={disabledCount} note="Installed but not active" />
        <StatsCard label="configured" value={configuredCount} note="Apps with workspace config saved" />
      </section>

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">App catalog</div>
            <div className="muted">Install, enable, disable, and configure per-organisation app workspaces from one screen.</div>
          </div>
          <div className="badge badge-neutral"><Blocks size={14} /> Canonical provisioning</div>
        </div>

        <div className="stack">
          {catalog.map((app: any) => {
            const installation = installationMap.get(app.id);
            const status = installation?.status ?? "not_installed";
            const nextStatus = installation?.status === "enabled" ? "disabled" : "enabled";
            const buttonLabel = installation?.status === "enabled" ? "Disable" : installation?.status === "disabled" ? "Enable" : "Install";
            const config = installation?.config ?? {};

            return (
              <section key={app.id} className="panel-soft section stack">
                <div className="row-between">
                  <div>
                    <div className="h2">{app.app_name}</div>
                    <div className="muted">{app.app_key}</div>
                    <div className="muted">{app.description || "—"}</div>
                  </div>
                  <div className="row">
                    <span className={statusBadgeClass(app.status)}>{titleCase(app.status)}</span>
                    <span className={statusBadgeClass(status)}>{titleCase(status)}</span>
                  </div>
                </div>

                <div className="grid-cards">
                  <div className="stat-blk">
                    <div className="stat-val">{status === "not_installed" ? "—" : titleCase(status)}</div>
                    <div className="stat-lbl">installation status</div>
                  </div>
                  <div className="stat-blk">
                    <div className="stat-val">{formatDateTime(installation?.installed_at)}</div>
                    <div className="stat-lbl">installed at</div>
                  </div>
                  <div className="stat-blk">
                    <div className="stat-val">{config.workspace_slug || "—"}</div>
                    <div className="stat-lbl">workspace slug</div>
                  </div>
                  <div className="stat-blk">
                    <div className="stat-val">{config.seats_allocated ?? "—"}</div>
                    <div className="stat-lbl">seats allocated</div>
                  </div>
                </div>

                <div className="row">
                  <form action={setAppInstallationAction}>
                    <input type="hidden" name="org_id" value={orgId} />
                    <input type="hidden" name="app_id" value={app.id} />
                    <input type="hidden" name="next_status" value={nextStatus} />
                    <button className="btn btn-secondary" type="submit">{buttonLabel}</button>
                  </form>
                </div>

                {installation ? (
                  <section className="panel section stack">
                    <div className="row-between">
                      <div>
                        <div className="h2">Provisioning config</div>
                        <div className="muted">Store workspace URL, slug, seats, feature flags, and internal notes inside app_installations.config.</div>
                      </div>
                      <div className="badge badge-green"><Settings2 size={14} /> Workspace settings</div>
                    </div>
                    <AppProvisioningConfigForm
                      orgId={orgId}
                      appId={app.id}
                      config={installation.config}
                      action={updateAppInstallationConfigAction}
                    />
                  </section>
                ) : (
                  <div className="notice">Install this app first before configuring workspace settings.</div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </ConsoleShell>
  );
}
