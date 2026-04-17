import { ConsoleShell } from "@/components/console-shell";
import { CreateOrganisationForm } from "@/components/create-organisation-form";
import Link from "next/link";

export default async function NewOrganisationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <ConsoleShell title="New Organisation">
      <div className="mb-4">
        <Link href="/organisations" className="text-sm text-emerald-700 hover:underline">
          ← Back to organisations
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="text-sm font-medium text-slate-900">Create a new organisation</div>
          <div className="mt-1 text-sm text-slate-500">
            This creates the first Console-level organisation record.
          </div>
        </div>

        <CreateOrganisationForm errorMessage={params.error} />
      </div>
    </ConsoleShell>
  );
}
