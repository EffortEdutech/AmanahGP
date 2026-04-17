"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthUser } from "@/lib/console/access";
import { getCurrentPublicUser, writeAuditLog } from "@/lib/console/server";

export async function acceptInviteAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const { supabase, user } = await requireAuthUser();

  if (!token) {
    redirect("/login?error=Missing invitation token");
  }

  const { data: invitation, error } = await supabase
    .from("org_invitations")
    .select("id, organization_id, invited_email, org_role, status, expires_at")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Invitation not found")}`);
  }

  if (invitation.status !== "pending") {
    redirect(`/login?error=${encodeURIComponent(`Invitation is ${invitation.status}`)}`);
  }

  if (user.email?.toLowerCase() !== String(invitation.invited_email).toLowerCase()) {
    redirect("/login?error=This invitation is for a different email address");
  }

  const publicUser = await getCurrentPublicUser(supabase, user.id, user.email);
  if (!publicUser) {
    redirect("/login?error=Public user record not found");
  }

  const existingMember = await supabase
    .from("org_members")
    .select("id")
    .eq("organization_id", invitation.organization_id)
    .eq("user_id", publicUser.id)
    .maybeSingle();

  if (!existingMember.data) {
    const { error: insertError } = await supabase.from("org_members").insert({
      organization_id: invitation.organization_id,
      user_id: publicUser.id,
      org_role: invitation.org_role,
      status: "active",
      accepted_at: new Date().toISOString(),
      invited_at: new Date().toISOString(),
    });

    if (insertError) {
      redirect(`/login?error=${encodeURIComponent(insertError.message)}`);
    }
  }

  const { error: updateError } = await supabase
    .from("org_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", invitation.id);

  if (updateError) {
    redirect(`/login?error=${encodeURIComponent(updateError.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "org_invitation.accepted",
    entityTable: "org_invitations",
    entityId: invitation.id,
    organizationId: invitation.organization_id,
  });

  revalidatePath(`/organisations/${invitation.organization_id}/members`);
  redirect(`/accept-invite/${token}?accepted=1`);
}

