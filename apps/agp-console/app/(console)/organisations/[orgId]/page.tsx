import Link from "next/link";
import { Blocks, Gavel, Pencil, Users, Wallet } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { AddComplianceNoteForm } from "@/components/add-compliance-note-form";
import { OrganizationAuditTimeline } from "@/components/organization-audit-timeline";
import { OrganizationCompliancePanel } from "@/components/organization-compliance-panel";
import { OrganizationLifecycleQuickActions } from "@/components/organization-lifecycle-quick-actions";
import { OrganizationStatusForm } from "@/components/organization-status-form";
import { addComplianceNoteAction } from "@/app/(console)/reviews/actions";
import { runOrganizationLifecycleAction, updateOrganizationStatusAction } from "@/app/(console)/organisations/actions";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDate, formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import {
  getOrganizationAuditLogs,
  getOrganizationById,
  getOrganizationComplianceOverview,
} from "@/lib/console/server";

export default async function OrganisationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string; created?: string; updated?: string; noted?: string }>;
}) {
  const { orgId } = await params;
  const { error, created, updated, noted } = await searchParams;
  const { user, roles } = await requireConsoleAccess("organizations.read");
  const [organization, compliance, auditLogs] = await Promise.all([
    getOrganizationById(orgId),
    getOrganizationComplianceOverview(orgId),
    getOrganizationAuditLogs(orgId, 12),
  ]);

  return (
    <ConsoleShell
      title={organization.legal_name ?? organization.name}
      description="Console overview for organisation lifecycle, members, app provisioning, billing, compliance follow-up, and internal review notes."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}
      {created ? <div className="notice">Organisation created successfully.</div> : null}
      {updated ? <div className="notice">Organisation updated successfully.</div> : null}
      {noted ? <div className="notice">Review note saved to audit log.</div> : null}

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
            <span className={statusBadgeClass(organization.onboarding_status)}>{titleCase(organization.onboarding_status)}</span>
            <span className={statusBadgeClass(organization.listing_status)}>{titleCase(organization.listing_status)}</span>
          </div>
          <div className="muted">Registration No: {organization.registration_no || "—"}</div>
          <div className="muted">Type: {organization.org_type ? titleCase(organization.org_type) : "—"}</div>
          <div className="muted">Website: {organization.website_url || "—"}</div>
          <div className="muted">Contact: {organization.contact_email || "—"}</div>
          <div className="muted">Phone: {organization.contact_phone || "—"}</div>
          <div className="muted">Address: {organization.address_text || "—"}</div>
          <div className="muted">Summary: {organization.summary || "—"}</div>
          <div className="muted">Onboarding submitted: {formatDateTime(organization.onboarding_submitted_at)}</div>
          <div className="muted">Approved at: {formatDateTime(organization.approved_at)}</div>
          <div className="muted">Created: {formatDate(organization.created_at)}</div>
          <div className="muted">Updated: {formatDateTime(organization.updated_at)}</div>
        </div>

        <div className="panel section stack">
          <div className="h2">Quick links</div>
          <div className="row">
            <Link className="btn btn-secondary" href={`/organisations/${orgId}/members`}><Users size={16} /> Members</Link>
            <Link className="btn btn-secondary" href={`/organisations/${orgId}/apps`}><Blocks size={16} /> Apps</Link>
            <Link className="btn btn-secondary" href={`/organisations/${orgId}/billing`}><Wallet size={16} /> Billing</Link>
            <Link className="btn btn-secondary" href={`/cases?organizationId=${orgId}`}><Gavel size={16} /> Cases</Link>
            <Link className="btn btn-secondary" href={`/cases/new?orgId=${orgId}`}><Gavel size={16} /> Open case</Link>
            <Link className="btn btn-secondary" href="/compliance">Compliance Center</Link>
            <Link className="btn btn-secondary" href="/reviews">Verification Queue</Link>
          </div>
          <div className="notice">
            Canonical organisation lifecycle uses onboarding_status and listing_status only.
          </div>
        </div>
      </section>

      <OrganizationCompliancePanel row={compliance} />

      <section className="grid-cards">
        <section className="panel section stack">
          <div className="h2">Add internal review note</div>
          <div className="muted">Saved as an audit record for compliance follow-up and regulator preparation.</div>
          <AddComplianceNoteForm orgId={orgId} returnTo={`/organisations/${orgId}`} action={addComplianceNoteAction} />
        </section>

        <section className="panel section stack">
          <div className="h2">Recent governance timeline</div>
          <OrganizationAuditTimeline logs={auditLogs as any[]} />
        </section>
      </section>

      <section className="panel section stack">
        <div className="h2">Lifecycle control</div>
        <OrganizationLifecycleQuickActions orgId={organization.id} action={runOrganizationLifecycleAction} />
        <OrganizationStatusForm organization={organization} action={updateOrganizationStatusAction} />
      </section>
    </ConsoleShell>
  );
}
