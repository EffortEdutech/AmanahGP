import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsoleShell } from "@/components/console-shell";
import { PublicTrustProfileCard } from "@/components/public-trust-profile-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getPublicTrustProfile } from "@/lib/console/public-trust-profiles";

export default async function PublicTrustProfileDetailPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const { user, roles } = await requireConsoleAccess("cases.read");
  const profile = await getPublicTrustProfile(organizationId);

  if (!profile) {
    notFound();
  }

  return (
    <ConsoleShell
      title="Public Trust Profile Preview"
      description="Detailed donor-facing preview for one organisation."
      currentPath="/public-trust-profiles"
      roles={roles}
      userEmail={user.email}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Link className="btn-secondary" href="/public-trust-profiles">
          Back to public trust profiles
        </Link>
        <Link className="btn-secondary" href={`/organisations/${profile.organization_id}`}>
          Open organisation
        </Link>
      </div>

      <PublicTrustProfileCard profile={profile} />
    </ConsoleShell>
  );
}
