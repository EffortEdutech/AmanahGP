import Link from "next/link";
import { CirclePlus, Eye, Pencil } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDate, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import { listOrganizations } from "@/lib/console/server";

export default async function OrganisationsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { user, roles } = await requireConsoleAccess("organizations.read");
  const organizations = await listOrganizations();
  const { error } = await searchParams;

  return (
    <ConsoleShell
      title="Organisations"
      description="Create and govern organisations using the canonical public.organizations table."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

      <section className="panel section stack">
        <div className="row-between">
          <div>
            <div className="h2">Organisation registry</div>
            <div className="muted">All AGP organisations managed from the platform control plane.</div>
          </div>
          <Link className="btn btn-primary" href="/organisations/new">
            <CirclePlus size={16} />
            Create organisation
          </Link>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Type</th>
                <th>Onboarding</th>
                <th>Listing</th>
                <th>Approved</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{organization.legal_name ?? organization.name}</div>
                    <div className="muted">{organization.registration_no || organization.name}</div>
                  </td>
                  <td>{titleCase(organization.org_type)}</td>
                  <td><span className={statusBadgeClass(organization.onboarding_status)}>{titleCase(organization.onboarding_status)}</span></td>
                  <td><span className={statusBadgeClass(organization.listing_status)}>{titleCase(organization.listing_status)}</span></td>
                  <td>{formatDate(organization.approved_at)}</td>
                  <td>{formatDate(organization.created_at)}</td>
                  <td>
                    <div className="row">
                      <Link className="btn btn-secondary" href={`/organisations/${organization.id}`}>
                        <Eye size={16} />
                        Open
                      </Link>
                      <Link className="btn btn-secondary" href={`/organisations/${organization.id}/edit`}>
                        <Pencil size={16} />
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">No organisations yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </ConsoleShell>
  );
}
