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

export type ComplianceOrganizationRow = {
  id: string;
  name: string;
  legal_name: string | null;
  registration_no: string | null;
  org_type: string | null;
  onboarding_status: string;
  listing_status: string;
  active_members: number;
  pending_invites: number;
  active_apps: number;
  subscription_status: string | null;
  open_billing_records: number;
  last_activity_at: string | null;
  risk_level: "good" | "warning" | "danger";
  issues: string[];
};

export type GovernanceReviewCaseRow = {
  id: string;
  case_code: string;
  organization_id: string;
  review_type: string;
  status: string;
  priority: string;
  intake_source: string;
  summary: string | null;
  due_at: string | null;
  opened_at: string;
  submitted_at: string | null;
  review_started_at: string | null;
  scholar_started_at: string | null;
  approval_started_at: string | null;
  closed_at: string | null;
  outcome: string | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  organization?: {
    id: string;
    name: string | null;
    legal_name: string | null;
    registration_no: string | null;
    org_type: string | null;
  } | null;
};

export type GovernanceCaseAssignmentRow = {
  id: string;
  case_id: string;
  assignee_user_id: string;
  assignment_role: string;
  status: string;
  notes: string | null;
  assigned_by_user_id: string | null;
  assigned_at: string;
  responded_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string | null;
    auth_provider_user_id: string;
    platform_role: string;
    is_active: boolean;
  } | null;
};


export type GovernanceCaseFindingRow = {
  id: string;
  case_id: string;
  finding_type: string;
  severity: string;
  status: string;
  title: string;
  details: string | null;
  recommendation: string | null;
  recorded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string | null;
    auth_provider_user_id: string;
  } | null;
};

export type GovernanceCaseEvidenceRow = {
  id: string;
  case_id: string;
  finding_id: string | null;
  evidence_type: string;
  title: string;
  evidence_url: string | null;
  notes: string | null;
  recorded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    display_name: string | null;
    auth_provider_user_id: string;
  } | null;
  finding?: {
    id: string;
    title: string;
  } | null;
};

export type AssignableConsoleUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  auth_provider_user_id: string;
  platform_role: string;
  is_active: boolean;
  console_roles: string[];
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

  const [orgs, apps, plans, invites, cases] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("app_installations").select("id", { count: "exact", head: true }),
    supabase.from("billing_plans").select("id", { count: "exact", head: true }),
    supabase.from("org_invitations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("governance_review_cases").select("id", { count: "exact", head: true }),
  ]);

  return {
    organizations: orgs.count ?? 0,
    installations: apps.count ?? 0,
    plans: plans.count ?? 0,
    pendingInvites: invites.count ?? 0,
    governanceCases: cases.count ?? 0,
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

  const [invitesResp, billingResp, subsResp, orgsResp, casesResp] = await Promise.all([
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
    supabase
      .from("governance_review_cases")
      .select("id, case_code, organization_id, status, due_at, priority, updated_at")
      .in("status", ["submitted", "under_review", "scholar_review", "approval_pending"])
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  for (const response of [invitesResp, billingResp, subsResp, orgsResp, casesResp]) {
    if (response.error) {
      throw new Error(response.error.message);
    }
  }

  const orgIds = [
    ...(invitesResp.data ?? []).map((row) => row.organization_id),
    ...(billingResp.data ?? []).map((row) => row.organization_id),
    ...(subsResp.data ?? []).map((row) => row.organization_id),
    ...(orgsResp.data ?? []).map((row) => row.id),
    ...(casesResp.data ?? []).map((row) => row.organization_id),
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
    let level: "warning" | "danger" = "warning";

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

  for (const reviewCase of casesResp.data ?? []) {
    notifications.push({
      id: `case-${reviewCase.id}`,
      kind: "compliance",
      level: reviewCase.priority === "urgent" || reviewCase.priority === "high" ? "warning" : "info",
      title: `Governance case ${reviewCase.case_code} is ${reviewCase.status.replaceAll("_", " ")}`,
      body: reviewCase.due_at
        ? `Case is due on ${new Date(reviewCase.due_at).toLocaleDateString("en-MY")}.`
        : "Governance case needs reviewer follow-up.",
      occurredAt: reviewCase.updated_at,
      href: `/cases/${reviewCase.id}`,
      organization: orgLookup.get(reviewCase.organization_id) ?? null,
      metadata: {
        status: reviewCase.status,
        priority: reviewCase.priority,
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
    reviewers: assignments.filter((row: any) => row.role === "platform_reviewer" && row.is_active).length,
    scholars: assignments.filter((row: any) => row.role === "platform_scholar" && row.is_active).length,
    approvers: assignments.filter((row: any) => row.role === "platform_approver" && row.is_active).length,
  };
}

function deriveCompliance(input: {
  onboarding_status: string;
  listing_status: string;
  active_members: number;
  pending_invites: number;
  active_apps: number;
  subscription_status: string | null;
  open_billing_records: number;
}) {
  const issues: string[] = [];
  let riskLevel: ComplianceOrganizationRow["risk_level"] = "good";

  const raiseToWarning = () => {
    if (riskLevel === "good") riskLevel = "warning";
  };
  const raiseToDanger = () => {
    riskLevel = "danger";
  };

  if (input.onboarding_status === "changes_requested") {
    issues.push("Onboarding changes requested");
    raiseToWarning();
  }
  if (input.onboarding_status === "rejected") {
    issues.push("Onboarding rejected");
    raiseToDanger();
  }
  if (input.listing_status === "suspended") {
    issues.push("Public listing suspended");
    raiseToDanger();
  }
  if (input.listing_status === "listed" && input.onboarding_status !== "approved") {
    issues.push("Listed without approved onboarding");
    raiseToDanger();
  }
  if (input.active_members === 0) {
    issues.push("No active members");
    raiseToWarning();
  }
  if (input.pending_invites > 0) {
    issues.push(`${input.pending_invites} pending invite${input.pending_invites > 1 ? "s" : ""}`);
    raiseToWarning();
  }
  if (input.active_apps === 0) {
    issues.push("No active apps installed");
    raiseToWarning();
  }
  if (!input.subscription_status) {
    issues.push("No subscription assigned");
    raiseToWarning();
  } else if (["past_due", "cancelled"].includes(input.subscription_status)) {
    issues.push(`Subscription ${input.subscription_status.replaceAll("_", " ")}`);
    raiseToDanger();
  } else if (input.subscription_status === "draft") {
    issues.push("Subscription still in draft");
    raiseToWarning();
  }
  if (input.open_billing_records > 0) {
    issues.push(`${input.open_billing_records} open billing record${input.open_billing_records > 1 ? "s" : ""}`);
    raiseToWarning();
  }

  return { riskLevel, issues };
}

export async function listComplianceOrganizations(): Promise<ComplianceOrganizationRow[]> {
  const supabase = await createSupabaseServerClient();
  const [orgsResp, membersResp, invitesResp, appsResp, subsResp, billingResp, auditResp] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, legal_name, registration_no, org_type, onboarding_status, listing_status, updated_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("org_members")
      .select("organization_id, status"),
    supabase
      .from("org_invitations")
      .select("organization_id, status"),
    supabase
      .from("app_installations")
      .select("organization_id, status, updated_at"),
    supabase
      .from("organization_subscriptions")
      .select("organization_id, status, updated_at"),
    supabase
      .from("organization_billing_records")
      .select("organization_id, status, billed_at, created_at"),
    supabase
      .from("audit_logs")
      .select("organization_id, occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(500),
  ]);

  for (const response of [orgsResp, membersResp, invitesResp, appsResp, subsResp, billingResp, auditResp]) {
    if (response.error) {
      throw new Error(response.error.message);
    }
  }

  const memberCount = new Map<string, number>();
  const inviteCount = new Map<string, number>();
  const appCount = new Map<string, number>();
  const subStatus = new Map<string, { status: string; updated_at: string | null }>();
  const billingOpenCount = new Map<string, number>();
  const lastActivity = new Map<string, string>();

  for (const row of membersResp.data ?? []) {
    if (row.status === "active") {
      memberCount.set(row.organization_id, (memberCount.get(row.organization_id) ?? 0) + 1);
    }
  }

  for (const row of invitesResp.data ?? []) {
    if (row.status === "pending") {
      inviteCount.set(row.organization_id, (inviteCount.get(row.organization_id) ?? 0) + 1);
    }
  }

  for (const row of appsResp.data ?? []) {
    if (row.status === "enabled" || row.status === "active") {
      appCount.set(row.organization_id, (appCount.get(row.organization_id) ?? 0) + 1);
    }
    if (row.updated_at) {
      const existing = lastActivity.get(row.organization_id);
      if (!existing || new Date(row.updated_at).getTime() > new Date(existing).getTime()) {
        lastActivity.set(row.organization_id, row.updated_at);
      }
    }
  }

  for (const row of subsResp.data ?? []) {
    const existing = subStatus.get(row.organization_id);
    if (!existing || new Date(row.updated_at ?? 0).getTime() > new Date(existing.updated_at ?? 0).getTime()) {
      subStatus.set(row.organization_id, { status: row.status, updated_at: row.updated_at ?? null });
    }
  }

  for (const row of billingResp.data ?? []) {
    if (["pending", "issued"].includes(row.status)) {
      billingOpenCount.set(row.organization_id, (billingOpenCount.get(row.organization_id) ?? 0) + 1);
    }
    const timestamp = row.billed_at || row.created_at;
    if (timestamp) {
      const existing = lastActivity.get(row.organization_id);
      if (!existing || new Date(timestamp).getTime() > new Date(existing).getTime()) {
        lastActivity.set(row.organization_id, timestamp);
      }
    }
  }

  for (const row of auditResp.data ?? []) {
    if (!row.organization_id || !row.occurred_at) continue;
    const existing = lastActivity.get(row.organization_id);
    if (!existing || new Date(row.occurred_at).getTime() > new Date(existing).getTime()) {
      lastActivity.set(row.organization_id, row.occurred_at);
    }
  }

  return (orgsResp.data ?? []).map((org) => {
    const active_members = memberCount.get(org.id) ?? 0;
    const pending_invites = inviteCount.get(org.id) ?? 0;
    const active_apps = appCount.get(org.id) ?? 0;
    const subscription_status = subStatus.get(org.id)?.status ?? null;
    const open_billing_records = billingOpenCount.get(org.id) ?? 0;
    const compliance = deriveCompliance({
      onboarding_status: org.onboarding_status,
      listing_status: org.listing_status,
      active_members,
      pending_invites,
      active_apps,
      subscription_status,
      open_billing_records,
    });

    return {
      id: org.id,
      name: org.name,
      legal_name: org.legal_name,
      registration_no: org.registration_no,
      org_type: org.org_type,
      onboarding_status: org.onboarding_status,
      listing_status: org.listing_status,
      active_members,
      pending_invites,
      active_apps,
      subscription_status,
      open_billing_records,
      last_activity_at: lastActivity.get(org.id) ?? org.updated_at ?? null,
      risk_level: compliance.riskLevel,
      issues: compliance.issues,
    } satisfies ComplianceOrganizationRow;
  });
}

export async function getComplianceSummary() {
  const rows = await listComplianceOrganizations();
  return {
    total: rows.length,
    good: rows.filter((row) => row.risk_level === "good").length,
    warning: rows.filter((row) => row.risk_level === "warning").length,
    danger: rows.filter((row) => row.risk_level === "danger").length,
    approved: rows.filter((row) => row.onboarding_status === "approved").length,
    listed: rows.filter((row) => row.listing_status === "listed").length,
  };
}

export async function getOrganizationComplianceOverview(orgId: string) {
  const rows = await listComplianceOrganizations();
  return rows.find((row) => row.id === orgId) ?? null;
}

export async function getOrganizationAuditLogs(orgId: string, limit = 20) {
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
        )
      `,
    )
    .eq("organization_id", orgId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listVerificationQueue() {
  const rows = await listComplianceOrganizations();
  return rows
    .filter(
      (row) =>
        row.risk_level !== "good" ||
        ["submitted", "changes_requested", "rejected"].includes(row.onboarding_status) ||
        row.listing_status === "suspended",
    )
    .sort((a, b) => {
      const weight = { danger: 3, warning: 2, good: 1 } as const;
      const riskDiff = weight[b.risk_level] - weight[a.risk_level];
      if (riskDiff !== 0) return riskDiff;
      return new Date(b.last_activity_at ?? 0).getTime() - new Date(a.last_activity_at ?? 0).getTime();
    });
}

export async function listGovernanceReviewCases(filters?: {
  organizationId?: string;
  status?: string;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("governance_review_cases")
    .select(
      `
        id,
        case_code,
        organization_id,
        review_type,
        status,
        priority,
        intake_source,
        summary,
        due_at,
        opened_at,
        submitted_at,
        review_started_at,
        scholar_started_at,
        approval_started_at,
        closed_at,
        outcome,
        created_by_user_id,
        created_at,
        updated_at,
        organization:organizations!governance_review_cases_organization_id_fkey (
          id,
          name,
          legal_name,
          registration_no,
          org_type
        )
      `,
    )
    .order("updated_at", { ascending: false });

  if (filters?.organizationId) {
    query = query.eq("organization_id", filters.organizationId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as GovernanceReviewCaseRow[];
}

export async function getGovernanceReviewCaseById(caseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("governance_review_cases")
    .select(
      `
        id,
        case_code,
        organization_id,
        review_type,
        status,
        priority,
        intake_source,
        summary,
        due_at,
        opened_at,
        submitted_at,
        review_started_at,
        scholar_started_at,
        approval_started_at,
        closed_at,
        outcome,
        created_by_user_id,
        created_at,
        updated_at,
        organization:organizations!governance_review_cases_organization_id_fkey (
          id,
          name,
          legal_name,
          registration_no,
          org_type
        )
      `,
    )
    .eq("id", caseId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as GovernanceReviewCaseRow;
}

export async function listGovernanceCaseAssignments(caseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("governance_case_assignments")
    .select(
      `
        id,
        case_id,
        assignee_user_id,
        assignment_role,
        status,
        notes,
        assigned_by_user_id,
        assigned_at,
        responded_at,
        completed_at,
        created_at,
        updated_at
      `,
    )
    .eq("case_id", caseId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const authUserIds = Array.from(new Set((data ?? []).map((row) => String(row.assignee_user_id))));
  const userResponse = authUserIds.length
    ? await supabase
        .from("users")
        .select("id, auth_provider_user_id, email, display_name, platform_role, is_active")
        .in("auth_provider_user_id", authUserIds)
    : { data: [], error: null as any };

  if (userResponse.error) {
    throw new Error(userResponse.error.message);
  }

  const userLookup = new Map(
    (userResponse.data ?? []).map((row: any) => [String(row.auth_provider_user_id), row]),
  );

  return (data ?? []).map((row) => ({
    ...row,
    user: userLookup.get(String(row.assignee_user_id)) ?? null,
  })) as GovernanceCaseAssignmentRow[];
}

export async function listAssignableConsoleUsers(): Promise<AssignableConsoleUserRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: roleRows, error: roleError } = await supabase
    .from("platform_user_roles")
    .select("user_id, role, is_active")
    .eq("is_active", true);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const authUserIds = Array.from(new Set((roleRows ?? []).map((row) => String(row.user_id))));
  if (authUserIds.length === 0) {
    return [];
  }

  const { data: users, error: userError } = await supabase
    .from("users")
    .select("id, auth_provider_user_id, email, display_name, platform_role, is_active")
    .in("auth_provider_user_id", authUserIds)
    .eq("is_active", true)
    .order("email", { ascending: true });

  if (userError) {
    throw new Error(userError.message);
  }

  const roleLookup = new Map<string, string[]>();
  for (const row of roleRows ?? []) {
    const key = String(row.user_id);
    roleLookup.set(key, [...(roleLookup.get(key) ?? []), String(row.role)]);
  }

  return (users ?? []).map((user: any) => ({
    ...user,
    console_roles: roleLookup.get(String(user.auth_provider_user_id)) ?? [],
  })) as AssignableConsoleUserRow[];
}

export async function getGovernanceCaseSummary() {
  const cases = await listGovernanceReviewCases();
  return {
    total: cases.length,
    submitted: cases.filter((row) => row.status === "submitted").length,
    under_review: cases.filter((row) => row.status === "under_review").length,
    scholar_review: cases.filter((row) => row.status === "scholar_review").length,
    approval_pending: cases.filter((row) => row.status === "approval_pending").length,
    approved: cases.filter((row) => row.status === "approved").length,
    improvement_required: cases.filter((row) => row.status === "improvement_required").length,
  };
}


export async function listGovernanceCaseFindings(caseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("governance_case_findings")
    .select(
      `
        id,
        case_id,
        finding_type,
        severity,
        status,
        title,
        details,
        recommendation,
        recorded_by_user_id,
        created_at,
        updated_at
      `,
    )
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const authUserIds = Array.from(new Set((data ?? []).map((row) => String(row.recorded_by_user_id)).filter(Boolean)));
  const userResponse = authUserIds.length
    ? await supabase
        .from("users")
        .select("id, auth_provider_user_id, email, display_name")
        .in("auth_provider_user_id", authUserIds)
    : { data: [], error: null as any };

  if (userResponse.error) {
    throw new Error(userResponse.error.message);
  }

  const userLookup = new Map(
    (userResponse.data ?? []).map((row: any) => [String(row.auth_provider_user_id), row]),
  );

  return (data ?? []).map((row) => ({
    ...row,
    user: row.recorded_by_user_id ? userLookup.get(String(row.recorded_by_user_id)) ?? null : null,
  })) as GovernanceCaseFindingRow[];
}

export async function listGovernanceCaseEvidence(caseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("governance_case_evidence")
    .select(
      `
        id,
        case_id,
        finding_id,
        evidence_type,
        title,
        evidence_url,
        notes,
        recorded_by_user_id,
        created_at,
        updated_at
      `,
    )
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const authUserIds = Array.from(new Set((data ?? []).map((row) => String(row.recorded_by_user_id)).filter(Boolean)));
  const findingIds = Array.from(new Set((data ?? []).map((row) => String(row.finding_id)).filter(Boolean)));

  const [userResponse, findingResponse] = await Promise.all([
    authUserIds.length
      ? supabase
          .from("users")
          .select("id, auth_provider_user_id, email, display_name")
          .in("auth_provider_user_id", authUserIds)
      : Promise.resolve({ data: [], error: null as any }),
    findingIds.length
      ? supabase
          .from("governance_case_findings")
          .select("id, title")
          .in("id", findingIds)
      : Promise.resolve({ data: [], error: null as any }),
  ]);

  if (userResponse.error) {
    throw new Error(userResponse.error.message);
  }

  if (findingResponse.error) {
    throw new Error(findingResponse.error.message);
  }

  const userLookup = new Map(
    (userResponse.data ?? []).map((row: any) => [String(row.auth_provider_user_id), row]),
  );
  const findingLookup = new Map(
    (findingResponse.data ?? []).map((row: any) => [String(row.id), row]),
  );

  return (data ?? []).map((row) => ({
    ...row,
    user: row.recorded_by_user_id ? userLookup.get(String(row.recorded_by_user_id)) ?? null : null,
    finding: row.finding_id ? findingLookup.get(String(row.finding_id)) ?? null : null,
  })) as GovernanceCaseEvidenceRow[];
}

export async function getGovernanceCaseFindingsSummary(caseId: string) {
  const [findings, evidence] = await Promise.all([
    listGovernanceCaseFindings(caseId),
    listGovernanceCaseEvidence(caseId),
  ]);

  return {
    total_findings: findings.length,
    open_findings: findings.filter((row) => row.status === "open").length,
    critical_findings: findings.filter((row) => row.severity === "critical" && row.status !== "resolved" && row.status !== "waived").length,
    resolved_findings: findings.filter((row) => row.status === "resolved").length,
    evidence_items: evidence.length,
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


