import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OrganizationRow = {
  id: string;
  name: string;
  legal_name: string | null;
  registration_no: string | null;
  org_type: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  country: string | null;
  state: string | null;
  address_text: string | null;
  oversight_authority: string | null;
  summary: string | null;
  onboarding_status: string;
  listing_status: string;
  workspace_status: string;
  owner_user_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export const getCurrentSession = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
});

export async function getCurrentPublicUser(supabase: SupabaseClient, authUserId: string, email?: string | null) {
  const byAuthId = await supabase
    .from("users")
    .select("id, email, display_name, auth_provider_user_id")
    .eq("auth_provider_user_id", authUserId)
    .maybeSingle();

  if (byAuthId.data) {
    return byAuthId.data;
  }

  if (email) {
    const byEmail = await supabase
      .from("users")
      .select("id, email, display_name, auth_provider_user_id")
      .eq("email", email)
      .maybeSingle();

    if (byEmail.data) {
      return byEmail.data;
    }
  }

  return null;
}

export async function getDashboardStats() {
  const supabase = await createSupabaseServerClient();

  const [orgs, apps, plans, invites] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("app_installations").select("id", { count: "exact", head: true }),
    supabase.from("billing_plans").select("id", { count: "exact", head: true }),
    supabase.from("org_invitations").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return {
    organizations: orgs.count ?? 0,
    installations: apps.count ?? 0,
    plans: plans.count ?? 0,
    pendingInvites: invites.count ?? 0,
  };
}

export async function listOrganizations() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `
        id,
        name,
        legal_name,
        registration_no,
        org_type,
        contact_email,
        contact_phone,
        website_url,
        country,
        state,
        address_text,
        oversight_authority,
        summary,
        onboarding_status,
        listing_status,
        workspace_status,
        owner_user_id,
        approved_at,
        created_at,
        updated_at
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrganizationRow[];
}

export async function getOrganizationById(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `
        id,
        name,
        legal_name,
        registration_no,
        org_type,
        contact_email,
        contact_phone,
        website_url,
        country,
        state,
        address_text,
        oversight_authority,
        summary,
        onboarding_status,
        listing_status,
        workspace_status,
        owner_user_id,
        approved_at,
        created_at,
        updated_at
      `,
    )
    .eq("id", orgId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as OrganizationRow;
}

export async function listOrganizationMembers(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("org_members")
    .select(
      `
        id,
        org_role,
        status,
        invited_at,
        accepted_at,
        created_at,
        user:users!org_members_user_id_fkey (
          id,
          email,
          display_name,
          platform_role
        )
      `,
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listOrganizationInvitations(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("org_invitations")
    .select(
      `
        id,
        invited_email,
        org_role,
        status,
        expires_at,
        accepted_at,
        token,
        created_at,
        inviter:users!org_invitations_invited_by_user_id_fkey (
          id,
          email,
          display_name
        )
      `,
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listAvailableApps() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_catalog")
    .select("id, app_key, app_name, description, status, sort_order")
    .order("sort_order", { ascending: true })
    .order("app_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listOrganizationInstallations(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_installations")
    .select(
      `
        id,
        organization_id,
        status,
        installed_at,
        disabled_at,
        config,
        app:app_catalog!app_installations_app_id_fkey (
          id,
          app_key,
          app_name,
          description,
          status,
          sort_order
        )
      `,
    )
    .eq("organization_id", orgId)
    .order("installed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listBillingPlans() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("billing_plans")
    .select("id, plan_key, plan_name, description, status, monthly_amount, yearly_amount, features, sort_order")
    .order("sort_order", { ascending: true })
    .order("plan_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getOrganizationSubscription(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(
      `
        id,
        organization_id,
        plan_id,
        billing_cycle,
        status,
        amount,
        currency_code,
        seats_included,
        seats_used,
        starts_at,
        next_billing_at,
        notes,
        created_at,
        updated_at,
        plan:billing_plans!organization_subscriptions_plan_id_fkey (
          id,
          plan_key,
          plan_name,
          monthly_amount,
          yearly_amount
        )
      `,
    )
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listOrganizationBillingRecords(orgId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organization_billing_records")
    .select("id, invoice_ref, billing_period_label, amount, currency_code, status, billed_at, paid_at, notes, created_at")
    .eq("organization_id", orgId)
    .order("billed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listAuditLogs(limit = 100) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(
      `
        id,
        action,
        entity_table,
        entity_id,
        metadata,
        occurred_at,
        actor_role,
        organization_id,
        actor:users!audit_logs_actor_user_id_fkey (
          id,
          email,
          display_name
        ),
        organization:organizations!audit_logs_organization_id_fkey (
          id,
          name,
          legal_name
        )
      `,
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function writeAuditLog(
  supabase: SupabaseClient,
  authUserId: string,
  input: {
    action: string;
    entityTable?: string;
    entityId?: string | null;
    organizationId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const publicUser = authUser
    ? await getCurrentPublicUser(supabase, authUserId, authUser.email)
    : null;

  if (!publicUser) {
    return;
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: publicUser.id,
    actor_role: "platform",
    organization_id: input.organizationId ?? null,
    action: input.action,
    entity_table: input.entityTable ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
}
