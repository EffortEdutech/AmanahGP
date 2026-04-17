"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { getCurrentPublicUser, writeAuditLog } from "@/lib/console/server";

const invitationSchema = z.object({
  org_id: z.string().uuid(),
  invited_email: z.string().trim().email("Valid email is required"),
  org_role: z.enum(["org_admin", "org_manager", "org_viewer"]),
});

export async function inviteMemberAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("members.write");

  const parsed = invitationSchema.safeParse({
    org_id: formData.get("org_id"),
    invited_email: formData.get("invited_email"),
    org_role: formData.get("org_role"),
  });

  if (!parsed.success) {
    redirect(`/organisations/${formData.get("org_id")}/members?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`);
  }

  const publicUser = await getCurrentPublicUser(supabase, user.id, user.email);
  if (!publicUser) {
    redirect(`/organisations/${parsed.data.org_id}/members?error=Public user profile not found for inviter`);
  }

  const { error } = await supabase.from("org_invitations").insert({
    organization_id: parsed.data.org_id,
    invited_email: parsed.data.invited_email,
    org_role: parsed.data.org_role,
    invited_by_user_id: publicUser.id,
  });

  if (error) {
    redirect(`/organisations/${parsed.data.org_id}/members?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "org_invitation.created",
    entityTable: "org_invitations",
    organizationId: parsed.data.org_id,
    metadata: { invited_email: parsed.data.invited_email, org_role: parsed.data.org_role },
  });

  revalidatePath(`/organisations/${parsed.data.org_id}/members`);
  redirect(`/organisations/${parsed.data.org_id}/members`);
}

export async function revokeInvitationAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("members.write");
  const orgId = String(formData.get("org_id") ?? "");
  const invitationId = String(formData.get("invitation_id") ?? "");

  if (!orgId || !invitationId) {
    redirect("/organisations?error=Missing invitation reference");
  }

  const { error } = await supabase
    .from("org_invitations")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", invitationId);

  if (error) {
    redirect(`/organisations/${orgId}/members?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "org_invitation.revoked",
    entityTable: "org_invitations",
    entityId: invitationId,
    organizationId: orgId,
  });

  revalidatePath(`/organisations/${orgId}/members`);
  redirect(`/organisations/${orgId}/members`);
}

export async function removeMemberAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("members.write");
  const orgId = String(formData.get("org_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");

  if (!orgId || !memberId) {
    redirect("/organisations?error=Missing member reference");
  }

  const { error } = await supabase
    .from("org_members")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    redirect(`/organisations/${orgId}/members?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "org_member.removed",
    entityTable: "org_members",
    entityId: memberId,
    organizationId: orgId,
  });

  revalidatePath(`/organisations/${orgId}/members`);
  redirect(`/organisations/${orgId}/members`);
}
