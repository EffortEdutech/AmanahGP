import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { OrganizationForm } from "@/components/organization-form";
import { createOrganizationAction } from "@/app/(console)/organisations/actions";
import { requireConsoleAccess } from "@/lib/console/access";

export default async function NewOrganisationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, roles } = await requireConsoleAccess("organizations.write");
  const { error } = await searchParams;

  return (
    <ConsoleShell
      title="Create organisation"
      description="Register a new organisation in public.organizations and set its platform lifecycle fields."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      <div className="row">
        <Link className="btn btn-secondary" href="/organisations">Back to organisations</Link>
      </div>
      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}
      <OrganizationForm action={createOrganizationAction} submitLabel="Create organisation" />
    </ConsoleShell>
  );
}
