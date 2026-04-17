import { createClient } from "@/lib/supabase/server";

type DashboardStats = {
  totalOrganisations: number;
  activeOrganisations: number;
  draftOrganisations: number;
  suspendedOrganisations: number;
};

export async function getCurrentConsoleRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("platform_user_roles")
    .select("role, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const roles = data?.map((row) => row.role) ?? [];

  if (roles.includes("platform_owner")) return "platform_owner";
  if (roles.includes("platform_admin")) return "platform_admin";
  if (roles.includes("platform_auditor")) return "platform_auditor";
  if (roles.includes("support_agent")) return "support_agent";

  return null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const { count: totalOrganisations } = await supabase
    .from("organisations")
    .select("*", { count: "exact", head: true });

  const { count: activeOrganisations } = await supabase
    .from("organisations")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: draftOrganisations } = await supabase
    .from("organisations")
    .select("*", { count: "exact", head: true })
    .eq("status", "draft");

  const { count: suspendedOrganisations } = await supabase
    .from("organisations")
    .select("*", { count: "exact", head: true })
    .eq("status", "suspended");

  return {
    totalOrganisations: totalOrganisations ?? 0,
    activeOrganisations: activeOrganisations ?? 0,
    draftOrganisations: draftOrganisations ?? 0,
    suspendedOrganisations: suspendedOrganisations ?? 0,
  };
}

export async function listOrganisations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organisations")
    .select("id, legal_name, registration_number, organisation_type, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load organisations", error.message);
    return [];
  }

  return data ?? [];
}

export async function getOrganisationById(organisationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organisations")
    .select("id, legal_name, registration_number, organisation_type, status, owner_user_id, created_at, updated_at")
    .eq("id", organisationId)
    .single();

  if (error) {
    console.error("Failed to load organisation", error.message);
    return null;
  }

  return data;
}

export async function listOrganisationMembers(organisationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organisation_memberships")
    .select("id, user_id, role, created_at")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load organisation members", error.message);
    return [];
  }

  return data ?? [];
}

export async function listOrganisationInvitations(organisationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organisation_invitations")
    .select("id, email, role, status, created_at, invited_by_user_id, revoked_at")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load organisation invitations", error.message);
    return [];
  }

  return data ?? [];
}
