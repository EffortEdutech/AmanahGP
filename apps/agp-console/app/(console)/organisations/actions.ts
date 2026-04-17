"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createOrganisationSchema = z.object({
  legal_name: z.string().trim().min(3, "Legal name is required"),
  registration_number: z.string().trim().optional(),
  organisation_type: z.string().trim().optional(),
  status: z.enum(["draft", "active", "suspended", "archived"]),
});

const updateStatusSchema = z.object({
  organisation_id: z.string().uuid(),
  status: z.enum(["draft", "active", "suspended", "archived"]),
});

const updateOrganisationDetailsSchema = z.object({
  organisation_id: z.string().uuid(),
  legal_name: z.string().trim().min(3, "Legal name is required"),
  registration_number: z.string().trim().optional(),
  organisation_type: z.string().trim().optional(),
});

const assignCurrentUserMembershipSchema = z.object({
  organisation_id: z.string().uuid(),
  role: z.enum([
    "org_owner",
    "org_admin",
    "finance_manager",
    "compliance_officer",
    "reviewer",
    "staff",
  ]),
});

const createInvitationSchema = z.object({
  organisation_id: z.string().uuid(),
  email: z.string().email("Valid email is required"),
  role: z.enum([
    "org_owner",
    "org_admin",
    "finance_manager",
    "compliance_officer",
    "reviewer",
    "staff",
  ]),
});

const revokeInvitationSchema = z.object({
  organisation_id: z.string().uuid(),
  invitation_id: z.string().uuid(),
});

export async function createOrganisationAction(formData: FormData) {
  const parsed = createOrganisationSchema.safeParse({
    legal_name: formData.get("legal_name"),
    registration_number: formData.get("registration_number") || undefined,
    organisation_type: formData.get("organisation_type") || undefined,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid form data";
    redirect(`/organisations/new?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organisations")
    .insert({
      legal_name: parsed.data.legal_name,
      registration_number: parsed.data.registration_number || null,
      organisation_type: parsed.data.organisation_type || null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/organisations/new?error=${encodeURIComponent(error?.message || "Failed to create organisation")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/organisations");
  redirect(`/organisations/${data.id}?created=1`);
}

export async function updateOrganisationStatusAction(formData: FormData) {
  const parsed = updateStatusSchema.safeParse({
    organisation_id: formData.get("organisation_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid status update";
    redirect(`/organisations?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("organisations")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.organisation_id);

  if (error) {
    redirect(`/organisations/${parsed.data.organisation_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/organisations");
  revalidatePath(`/organisations/${parsed.data.organisation_id}`);

  redirect(`/organisations/${parsed.data.organisation_id}?updated=1`);
}

export async function updateOrganisationDetailsAction(formData: FormData) {
  const parsed = updateOrganisationDetailsSchema.safeParse({
    organisation_id: formData.get("organisation_id"),
    legal_name: formData.get("legal_name"),
    registration_number: formData.get("registration_number") || undefined,
    organisation_type: formData.get("organisation_type") || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid organisation details";
    redirect(`/organisations/${formData.get("organisation_id")}?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organisations")
    .update({
      legal_name: parsed.data.legal_name,
      registration_number: parsed.data.registration_number || null,
      organisation_type: parsed.data.organisation_type || null,
    })
    .eq("id", parsed.data.organisation_id);

  if (error) {
    redirect(`/organisations/${parsed.data.organisation_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/organisations");
  revalidatePath(`/organisations/${parsed.data.organisation_id}`);
  redirect(`/organisations/${parsed.data.organisation_id}?updated=1`);
}

export async function assignCurrentUserMembershipAction(formData: FormData) {
  const parsed = assignCurrentUserMembershipSchema.safeParse({
    organisation_id: formData.get("organisation_id"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(`/organisations/${formData.get("organisation_id")}/members?error=${encodeURIComponent("Invalid membership input")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login`);
  }

  const { error } = await supabase.from("organisation_memberships").upsert(
    {
      organisation_id: parsed.data.organisation_id,
      user_id: user.id,
      role: parsed.data.role,
    },
    { onConflict: "organisation_id,user_id" }
  );

  if (error) {
    redirect(`/organisations/${parsed.data.organisation_id}/members?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/organisations/${parsed.data.organisation_id}/members`);
  redirect(`/organisations/${parsed.data.organisation_id}/members?memberAdded=1`);
}

export async function createOrganisationInvitationAction(formData: FormData) {
  const parsed = createInvitationSchema.safeParse({
    organisation_id: formData.get("organisation_id"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Invalid invitation input";
    redirect(`/organisations/${formData.get("organisation_id")}/members?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("organisation_invitations").insert({
    organisation_id: parsed.data.organisation_id,
    email: parsed.data.email,
    role: parsed.data.role,
    status: "pending",
    invited_by_user_id: user?.id ?? null,
  });

  if (error) {
    redirect(`/organisations/${parsed.data.organisation_id}/members?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/organisations/${parsed.data.organisation_id}/members`);
  redirect(`/organisations/${parsed.data.organisation_id}/members?inviteCreated=1`);
}

export async function revokeOrganisationInvitationAction(formData: FormData) {
  const parsed = revokeInvitationSchema.safeParse({
    organisation_id: formData.get("organisation_id"),
    invitation_id: formData.get("invitation_id"),
  });

  if (!parsed.success) {
    redirect(`/organisations/${formData.get("organisation_id")}/members?error=${encodeURIComponent("Invalid revoke request")}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("organisation_invitations")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.invitation_id);

  if (error) {
    redirect(`/organisations/${parsed.data.organisation_id}/members?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/organisations/${parsed.data.organisation_id}/members`);
  redirect(`/organisations/${parsed.data.organisation_id}/members?inviteRevoked=1`);
}
