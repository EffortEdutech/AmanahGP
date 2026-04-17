import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ConsoleNotificationItem } from "@/components/notification-feed";

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
  onboarding_submitted_at: string | null;
  approved_at: string | null;
  approved_by_user_id: string | null;
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
        onboarding_submitted_at,
        approved_at,
        approved_by_user_id,
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
        onboarding_submitted_at,
        approved_at,
        approved_by_user_id,
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

export async function listAuditLogs(
  limit = 100,
  filters?: { q?: string; entityTable?: string; organizationId?: string },
) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
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

  if (filters?.q) {
    query = query.ilike("action", `%${filters.q}%`);
  }

  if (filters?.entityTable) {
    query = query.eq("entity_table", filters.entityTable);
  }

  if (filters?.organizationId) {
    query = query.eq("organization_id", filters.organizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getOrganizationLookup(supabase: SupabaseClient, orgIds: string[]) {
  const uniqueOrgIds = Array.from(new Set(orgIds.filter(Boolean)));
  if (uniqueOrgIds.length === 0) return new Map<string, { id: string; name: string | null; legal_name: string | null }>();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, legal_name")
    .in("id", uniqueOrgIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.id, row]));
}

export async function listConsoleNotifications(limit = 30): Promise<ConsoleNotificationItem[]> {
  const supabase = await createSupabaseServerClient();

  const [invitesResp, billingResp, subsResp, orgsResp] = await Promise.all([
    supabase
      .from("org_invitations")
      .select("id, organization_id, invited_email, org_role, status, expires_at, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("organization_billing_records")
      .select("id, organization_id, invoice_ref, billing_period_label, amount, currency_code, status, billed_at, created_at")
      .in("status", ["pending", "issued"])
      .order("billed_at", { ascending: false })
      .limit(limit),
    supabase
      .from("organization_subscriptions")
      .select("id, organization_id, status, next_billing_at, updated_at")
      .in("status", ["past_due", "cancelled"])
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("organizations")
      .select("id, name, legal_name, onboarding_status, listing_status, updated_at")
      .or("onboarding_status.eq.changes_requested,onboarding_status.eq.rejected,listing_status.eq.suspended")
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  for (const response of [invitesResp, billingResp, subsResp, orgsResp]) {
    if (response.error) {
      throw new Error(response.error.message);
    }
  }

  const orgIds = [
    ...(invitesResp.data ?? []).map((row) => row.organization_id),
    ...(billingResp.data ?? []).map((row) => row.organization_id),
    ...(subsResp.data ?? []).map((row) => row.organization_id),
    ...(orgsResp.data ?? []).map((row) => row.id),
  ];

  const orgLookup = await getOrganizationLookup(supabase, orgIds);
  const notifications: ConsoleNotificationItem[] = [];

  for (const invite of invitesResp.data ?? []) {
    const expiresSoon = invite.expires_at ? new Date(invite.expires_at).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 3 : false;
    notifications.push({
      id: `invite-${invite.id}`,
      kind: "invitation",
      level: expiresSoon ? "warning" : "info",
      title: `Pending member invite for ${invite.invited_email}`,
      body: `Role ${invite.org_role} is still pending acceptance.${invite.expires_at ? ` Expires ${new Date(invite.expires_at).toLocaleDateString("en-MY")}.` : ""}`,
      occurredAt: invite.created_at,
      href: `/organisations/${invite.organization_id}/members`,
      organization: orgLookup.get(invite.organization_id) ?? null,
      metadata: { status: invite.status },
    });
  }

  for (const bill of billingResp.data ?? []) {
    const isDanger = bill.status === "issued";
    notifications.push({
      id: `billing-${bill.id}`,
      kind: "billing",
      level: isDanger ? "danger" : "warning",
      title: `${bill.status === "issued" ? "Issued" : "Pending"} invoice ${bill.invoice_ref}`,
      body: `${bill.billing_period_label || "Billing period"} for ${bill.currency_code} ${Number(bill.amount ?? 0).toFixed(2)} requires action.`,
      occurredAt: bill.billed_at || bill.created_at,
      href: `/organisations/${bill.organization_id}/billing`,
      organization: orgLookup.get(bill.organization_id) ?? null,
      metadata: { status: bill.status },
    });
  }

  for (const sub of subsResp.data ?? []) {
    notifications.push({
      id: `subscription-${sub.id}`,
      kind: "subscription",
      level: sub.status === "past_due" ? "danger" : "warning",
      title: `Subscription ${sub.status.replaceAll("_", " ")}`,
      body: sub.next_billing_at
        ? `Subscription needs review before ${new Date(sub.next_billing_at).toLocaleDateString("en-MY")}.`
        : "Subscription needs platform review.",
      occurredAt: sub.updated_at,
      href: `/organisations/${sub.organization_id}/billing`,
      organization: orgLookup.get(sub.organization_id) ?? null,
      metadata: { status: sub.status },
    });
  }

  for (const org of orgsResp.data ?? []) {
    let title = "Compliance follow-up";
    let body = "Organisation status requires review.";
    let level = "warning";

    if (org.onboarding_status === "changes_requested") {
      title = "Onboarding changes requested";
      body = "Organisation onboarding submission is waiting for corrections.";
    } else if (org.onboarding_status === "rejected") {
      title = "Onboarding rejected";
      body = "Organisation onboarding was rejected and needs follow-up.";
      level = "danger";
    } else if (org.listing_status === "suspended") {
      title = "Listing suspended";
      body = "Public listing is suspended and should be checked before reactivation.";
      level = "danger";
    }

    notifications.push({
      id: `org-${org.id}-${org.updated_at}`,
      kind: "compliance",
      level,
      title,
      body,
      occurredAt: org.updated_at,
      href: `/organisations/${org.id}`,
      organization: { id: org.id, name: org.name, legal_name: org.legal_name },
      metadata: {
        onboarding_status: org.onboarding_status,
        listing_status: org.listing_status,
      },
    });
  }

  notifications.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return notifications.slice(0, limit);
}

export async function getNotificationSummary() {
  const notifications = await listConsoleNotifications(60);
  return {
    total: notifications.length,
    danger: notifications.filter((item) => item.level === "danger").length,
    warning: notifications.filter((item) => item.level === "warning").length,
    invites: notifications.filter((item) => item.kind === "invitation").length,
    billing: notifications.filter((item) => item.kind === "billing" || item.kind === "subscription").length,
    compliance: notifications.filter((item) => item.kind === "compliance").length,
  };
}

type ConsoleUserRow = {
  id: string;
  auth_provider_user_id: string;
  email: string;
  display_name: string | null;
  platform_role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listConsoleUsers(query?: string, limit = 25): Promise<ConsoleUserRow[]> {
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("users")
    .select("id, auth_provider_user_id, email, display_name, platform_role, is_active, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query && query.trim()) {
    const q = query.trim();
    request = request.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
  }

  const { data, error } = await request;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ConsoleUserRow[];
}

export async function listPlatformRoleAssignments() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platform_user_roles")
    .select("user_id, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const authUserIds = Array.from(new Set((data ?? []).map((row) => String(row.user_id))));
  const usersResponse = authUserIds.length
    ? await supabase
        .from("users")
        .select("id, auth_provider_user_id, email, display_name, platform_role, is_active")
        .in("auth_provider_user_id", authUserIds)
    : { data: [], error: null as any };

  if (usersResponse.error) {
    throw new Error(usersResponse.error.message);
  }

  const userLookup = new Map(
    (usersResponse.data ?? []).map((row: any) => [String(row.auth_provider_user_id), row]),
  );

  return (data ?? []).map((row) => ({
    ...row,
    user: userLookup.get(String(row.user_id)) ?? null,
  }));
}

export async function getPlatformRoleStats() {
  const assignments = await listPlatformRoleAssignments();
  return {
    total: assignments.length,
    active: assignments.filter((row: any) => row.is_active).length,
    owners: assignments.filter((row: any) => row.role === "platform_owner" && row.is_active).length,
    admins: assignments.filter((row: any) => row.role === "platform_admin" && row.is_active).length,
    auditors: assignments.filter((row: any) => row.role === "platform_auditor" && row.is_active).length,
  };
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
