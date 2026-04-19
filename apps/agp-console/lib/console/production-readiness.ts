import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CONSOLE_CRITICAL_FLOW, CONSOLE_UAT_CHECKLIST } from "@/lib/console/navigation";

export type ProductionReadinessSummary = {
  organizations: number;
  cases: number;
  reviewAlerts: number;
  currentSnapshots: number;
  clarificationsOpen: number;
  plans: number;
  platformRoles: number;
  issues: string[];
};

type CountResult = {
  count: number;
  issue: string | null;
};

async function safeCount(
  label: string,
  queryFactory: (supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) => Promise<{
    count: number | null;
    error: { message?: string | null } | null;
  }>,
): Promise<CountResult> {
  const supabase = await createSupabaseServerClient();

  try {
    const result = await queryFactory(supabase);

    if (result.error) {
      return {
        count: 0,
        issue: `${label}: ${result.error.message ?? "query failed"}`,
      };
    }

    return {
      count: result.count ?? 0,
      issue: null,
    };
  } catch (error) {
    return {
      count: 0,
      issue: `${label}: ${error instanceof Error ? error.message : "unexpected failure"}`,
    };
  }
}

export async function getProductionReadinessSummary(): Promise<ProductionReadinessSummary> {
  const [organizations, cases, alerts, snapshots, clarifications, plans, roles] = await Promise.all([
    safeCount("organizations", (supabase) =>
      supabase.from("organizations").select("id", { count: "exact", head: true }),
    ),
    safeCount("governance_review_cases", (supabase) =>
      supabase.from("governance_review_cases").select("id", { count: "exact", head: true }),
    ),
    safeCount("v_governance_review_alerts", (supabase) =>
      supabase.from("v_governance_review_alerts").select("alert_key", { count: "exact", head: true }),
    ),
    safeCount("organization_trust_snapshots", (supabase) =>
      supabase.from("organization_trust_snapshots").select("id", { count: "exact", head: true }).eq("is_current", true),
    ),
    safeCount("governance_case_clarifications", (supabase) =>
      supabase
        .from("governance_case_clarifications")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review", "needs_more_info"]),
    ),
    safeCount("billing_plans", (supabase) =>
      supabase.from("billing_plans").select("id", { count: "exact", head: true }),
    ),
    safeCount("platform_user_roles", (supabase) =>
      supabase.from("platform_user_roles").select("id", { count: "exact", head: true }),
    ),
  ]);

  return {
    organizations: organizations.count,
    cases: cases.count,
    reviewAlerts: alerts.count,
    currentSnapshots: snapshots.count,
    clarificationsOpen: clarifications.count,
    plans: plans.count,
    platformRoles: roles.count,
    issues: [
      organizations.issue,
      cases.issue,
      alerts.issue,
      snapshots.issue,
      clarifications.issue,
      plans.issue,
      roles.issue,
    ].filter((value): value is string => Boolean(value)),
  };
}

export function getConsoleCriticalFlow() {
  return CONSOLE_CRITICAL_FLOW;
}

export function getConsoleUatChecklist() {
  return CONSOLE_UAT_CHECKLIST;
}
