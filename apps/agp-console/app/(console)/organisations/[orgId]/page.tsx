import { ConsoleShell } from "@/components/console-shell";
import { EditOrganisationDetailsForm } from "@/components/edit-organisation-details-form";
import { UpdateOrganisationStatusForm } from "@/components/update-organisation-status-form";
import { getOrganisationById } from "@/lib/console/server";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function OrganisationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string; created?: string; updated?: string }>;
}) {
  const { orgId } = await params;
  const sp = await searchParams;
  const organisation = await getOrganisationById(orgId);

  if (!organisation) notFound();

  return (
    <ConsoleShell title="Organisation Detail">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/organisations" className="text-sm text-emerald-700 hover:underline">
          ← Back to organisations
        </Link>

        <Link
          href={`/organisations/${organisation.id}/members`}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Members & Invitations
        </Link>
      </div>

      {sp.created ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Organisation created successfully.
        </div>
      ) : null}

      {sp.updated ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Organisation updated successfully.
        </div>
      ) : null}

      {sp.error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sp.error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500">Legal name</div>
                <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {organisation.legal_name}
                </h2>
              </div>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(organisation.status)}`}>
                {organisation.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Registration Number</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{organisation.registration_number || "—"}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Organisation Type</div>
                <div className="mt-2 text-sm font-medium text-slate-900">{organisation.organisation_type || "—"}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Created At</div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(organisation.created_at).toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Updated At</div>
                <div className="mt-2 text-sm font-medium text-slate-900">
                  {new Date(organisation.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-900">Edit organisation details</div>
              <div className="mt-1 text-sm text-slate-500">
                Update the core Console-level organisation information.
              </div>
            </div>

            <EditOrganisationDetailsForm organisation={organisation} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-medium text-slate-900">Status management</div>
            <div className="mt-1 text-sm text-slate-500">
              Change the organisation lifecycle state.
            </div>
          </div>

          <UpdateOrganisationStatusForm
            organisationId={organisation.id}
            currentStatus={organisation.status}
          />
        </div>
      </div>
    </ConsoleShell>
  );
}
