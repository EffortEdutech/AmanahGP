import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { GovernanceCaseCreateForm } from "@/components/governance-case-create-form";
import { requireConsoleAccess } from "@/lib/console/access";
import { listOrganizations } from "@/lib/console/server";

export default async function NewGovernanceCasePage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user, roles } = await requireConsoleAccess("cases.write");
  const organizations = await listOrganizations();

  return (
    <ConsoleShell
      title="Open Governance Review Case"
      description="Create a formal review case so AGP can assign reviewer, scholar, and approval responsibilities against one organisation."
      currentPath="/cases"
      roles={roles}
      userEmail={user.email}
    >
      {params.error ? <div className="notice notice-warning">{decodeURIComponent(params.error)}</div> : null}

      <section className="panel section stack">
        <div className="row-between">
          <div className="h2">New case</div>
          <Link className="btn btn-secondary" href="/cases">
            <ArrowLeft size={16} />
            Back to cases
          </Link>
        </div>

        <div className="notice">
          Governance cases are the working layer for verification, scholarly review, approvals, and improvement tracking.
        </div>

        <GovernanceCaseCreateForm
          organizations={organizations.map((org) => ({
            id: org.id,
            name: org.name,
            legal_name: org.legal_name,
            registration_no: org.registration_no,
          }))}
          selectedOrganizationId={params.orgId ?? null}
        />
      </section>
    </ConsoleShell>
  );
}
