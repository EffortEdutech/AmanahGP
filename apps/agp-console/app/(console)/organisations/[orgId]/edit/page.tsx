import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { OrganizationForm } from "@/components/organization-form";
import { updateOrganizationAction } from "@/app/(console)/organisations/actions";
import { requireConsoleAccess } from "@/lib/console/access";
import { getOrganizationById } from "@/lib/console/server";

export default async function EditOrganisationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { orgId } = await params;
  const { error } = await searchParams;
  const { user, roles } = await requireConsoleAccess("organizations.write");
  const organization = await getOrganizationById(orgId);

  return (
    <ConsoleShell
      title={`Edit — ${organization.legal_name ?? organization.name}`}
      description="Update the canonical organisation profile, legal details, and lifecycle fields."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      <div className="row">
        <Link className="btn btn-secondary" href={`/organisations/${orgId}`}>Back to organisation</Link>
      </div>
      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}
      <OrganizationForm action={updateOrganizationAction} organization={organization} submitLabel="Save changes" />
    </ConsoleShell>
  );
}
