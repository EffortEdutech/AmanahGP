import { ConsoleShell } from "@/components/console-shell";
import { listOrganisations } from "@/lib/console/server";
import Link from "next/link";

function statusClasses(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "draft":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "suspended":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function OrganisationsPage() {
  const organisations = await listOrganisations();

  return (
    <ConsoleShell title="Organisations">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-sm font-medium text-slate-900">Organisation registry</div>
            <div className="mt-1 text-sm text-slate-500">
              Live records from the Console organisations table.
            </div>
          </div>

          <Link
            href="/organisations/new"
            className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800"
          >
            New Organisation
          </Link>
        </div>

        {organisations.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No organisations found yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Legal Name</th>
                  <th className="px-5 py-3 font-medium">Registration</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {organisations.map((org) => (
                  <tr key={org.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <Link href={`/organisations/${org.id}`} className="text-emerald-700 hover:text-emerald-800 hover:underline">
                        {org.legal_name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{org.registration_number || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{org.organisation_type || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(org.status)}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ConsoleShell>
  );
}
