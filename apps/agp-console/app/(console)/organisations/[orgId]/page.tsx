import Link from "next/link";
import { Blocks, Pencil, Users, Wallet } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { OrganizationStatusForm } from "@/components/organization-status-form";
import { updateOrganizationStatusAction } from "@/app/(console)/organisations/actions";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDate, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import { getOrganizationById } from "@/lib/console/server";

export default async function OrganisationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { orgId } = await params;
  const { error } = await searchParams;
  const { user, roles } = await requireConsoleAccess("organizations.read");
  const organization = await getOrganizationById(orgId);

  return (
    <ConsoleShell
      title={organization.legal_name ?? organization.name}
      description="Console overview for organisation lifecycle, members, app provisioning, and billing."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="row-between">
            <div className="h2">Organisation profile</div>
            <Link className="btn btn-secondary" href={`/organisations/${orgId}/edit`}>
              <Pencil size={16} />
              Edit profile
            </Link>
          </div>
          <div className="row">
            <span className={statusBadgeClass(organization.workspace_status)}>{titleCase(organization.workspace_status)}</span>
            <span className={statusBadgeClass(organization.onboarding_status)}>{titleCase(organization.onboarding_status)}</span>
            <span className={statusBadgeClass(organization.listing_status)}>{titleCase(organization.listing_status)}</span>
          </div>
          <div className="muted">Registration No: {organization.registration_no || "—"}</div>
          <div className="muted">Type: {titleCase(organization.org_type)}</div>
          <div className="muted">Website: {organization.website_url || "—"}</div>
          <div className="muted">Contact: {organization.contact_email || "—"}</div>
          <div className="muted">Phone: {organization.contact_phone || "—"}</div>
          <div className="muted">Address: {organization.address_text || "—"}</div>
          <div className="muted">Summary: {organization.summary || "—"}</div>
          <div className="muted">Created: {formatDate(organization.created_at)}</div>
        </div>

        <div className="panel section stack">
          <div className="h2">Quick links</div>
          <div className="row">
            <Link className="btn btn-secondary" href={`/organisations/${orgId}/members`}><Users size={16} /> Members</Link>
            <Link className="btn btn-secondary" href={`/organisations/${orgId}/apps`}><Blocks size={16} /> Apps</Link>
            <Link className="btn btn-secondary" href={`/organisations/${orgId}/billing`}><Wallet size={16} /> Billing</Link>
          </div>
          <div className="notice">
            This organisation now uses the canonical platform data model only.
          </div>
        </div>
      </section>

      <section className="panel section stack">
        <div className="h2">Lifecycle control</div>
        <OrganizationStatusForm organization={organization} action={updateOrganizationStatusAction} />
      </section>
    </ConsoleShell>
  );
}
