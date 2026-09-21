import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PolicyStatus = "draft" | "active" | "retired" | "archived";
export type PolicyVersionStatus = "draft" | "published" | "active" | "superseded" | "retired" | "archived";
export type PolicyRuleCategory =
  | "submission"
  | "obligation"
  | "approval"
  | "exception"
  | "reporting"
  | "evidence"
  | "disclosure"
  | "governance_review"
  | "telemetry"
  | "other";

export type PolicySetRow = {
  id: string;
  authority_id: string;
  jurisdiction_id: string | null;
  code: string;
  name: string;
  description: string | null;
  policy_domain: string;
  status: PolicyStatus;
  created_at: string;
  updated_at: string;
  authority_name: string | null;
  jurisdiction_name: string | null;
  latest_version_label: string | null;
  latest_version_status: PolicyVersionStatus | null;
  active_version_id: string | null;
  active_version_label: string | null;
  rule_count: number;
};

export type PolicyVersionRow = {
  id: string;
  policy_set_id: string;
  authority_id: string;
  version_label: string;
  status: PolicyVersionStatus;
  summary: string | null;
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyRuleRow = {
  id: string;
  policy_version_id: string;
  authority_id: string;
  rule_code: string;
  rule_category: PolicyRuleCategory;
  rule_name: string;
  rule_description: string | null;
  severity: string;
  applies_to_org_types: string[];
  applies_to_fund_types: string[];
  trigger_event_type: string | null;
  due_interval_days: number | null;
  threshold_amount: number | null;
  threshold_currency: string;
  rule_config: Record<string, unknown>;
  sort_order: number;
  status: string;
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  return [];
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

export async function listPolicyVersions(policySetId: string): Promise<PolicyVersionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("policy_versions")
    .select("id, policy_set_id, authority_id, version_label, status, summary, approved_at, published_at, created_at, updated_at")
    .eq("policy_set_id", policySetId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    policy_set_id: String(row.policy_set_id),
    authority_id: String(row.authority_id),
    version_label: String(row.version_label),
    status: String(row.status) as PolicyVersionStatus,
    summary: row.summary ? String(row.summary) : null,
    approved_at: row.approved_at ? String(row.approved_at) : null,
    published_at: row.published_at ? String(row.published_at) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }));
}

export async function listPolicyRules(policyVersionId: string): Promise<PolicyRuleRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("policy_rules")
    .select(`
      id,
      policy_version_id,
      authority_id,
      rule_code,
      rule_category,
      rule_name,
      rule_description,
      severity,
      applies_to_org_types,
      applies_to_fund_types,
      trigger_event_type,
      due_interval_days,
      threshold_amount,
      threshold_currency,
      rule_config,
      sort_order,
      status
    `)
    .eq("policy_version_id", policyVersionId)
    .order("sort_order", { ascending: true })
    .order("rule_code", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    policy_version_id: String(row.policy_version_id),
    authority_id: String(row.authority_id),
    rule_code: String(row.rule_code),
    rule_category: String(row.rule_category) as PolicyRuleCategory,
    rule_name: String(row.rule_name),
    rule_description: row.rule_description ? String(row.rule_description) : null,
    severity: String(row.severity),
    applies_to_org_types: asStringArray(row.applies_to_org_types),
    applies_to_fund_types: asStringArray(row.applies_to_fund_types),
    trigger_event_type: row.trigger_event_type ? String(row.trigger_event_type) : null,
    due_interval_days: row.due_interval_days === null || row.due_interval_days === undefined ? null : Number(row.due_interval_days),
    threshold_amount: row.threshold_amount === null || row.threshold_amount === undefined ? null : Number(row.threshold_amount),
    threshold_currency: String(row.threshold_currency),
    rule_config: asRecord(row.rule_config),
    sort_order: Number(row.sort_order ?? 100),
    status: String(row.status),
  }));
}

export async function listPolicySets(): Promise<PolicySetRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("policy_sets")
    .select(`
      id,
      authority_id,
      jurisdiction_id,
      code,
      name,
      description,
      policy_domain,
      status,
      created_at,
      updated_at,
      authority:authorities!policy_sets_authority_id_fkey (
        id,
        name
      ),
      jurisdiction:jurisdictions!policy_sets_jurisdiction_id_fkey (
        id,
        name
      )
    `)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const policySets = data ?? [];
  const policySetIds = policySets.map((row) => String(row.id));

  const [versionsResp, periodsResp, rulesResp] = await Promise.all([
    policySetIds.length
      ? supabase
          .from("policy_versions")
          .select("id, policy_set_id, version_label, status, created_at")
          .in("policy_set_id", policySetIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    policySetIds.length
      ? supabase
          .from("policy_effective_periods")
          .select("policy_set_id, policy_version_id, effective_from, effective_to, status")
          .in("policy_set_id", policySetIds)
          .in("status", ["scheduled", "active"])
          .lte("effective_from", new Date().toISOString().slice(0, 10))
      : Promise.resolve({ data: [], error: null }),
    policySetIds.length
      ? supabase
          .from("policy_rules")
          .select("policy_version_id, status")
          .in("status", ["active", "draft"])
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const response of [versionsResp, periodsResp, rulesResp]) {
    if (response.error) throw new Error(response.error.message);
  }

  const latestVersionBySet = new Map<string, any>();
  const versionById = new Map<string, any>();
  for (const version of versionsResp.data ?? []) {
    const setId = String(version.policy_set_id);
    versionById.set(String(version.id), version);
    if (!latestVersionBySet.has(setId)) latestVersionBySet.set(setId, version);
  }

  const today = new Date().toISOString().slice(0, 10);
  const activePeriodBySet = new Map<string, any>();
  for (const period of periodsResp.data ?? []) {
    if (period.effective_to && String(period.effective_to) < today) continue;
    const setId = String(period.policy_set_id);
    const existing = activePeriodBySet.get(setId);
    if (!existing || String(period.effective_from) > String(existing.effective_from)) {
      activePeriodBySet.set(setId, period);
    }
  }

  const ruleCountByVersion = new Map<string, number>();
  for (const rule of rulesResp.data ?? []) {
    const key = String(rule.policy_version_id);
    ruleCountByVersion.set(key, (ruleCountByVersion.get(key) ?? 0) + 1);
  }

  return policySets.map((row: any) => {
    const authority = relationOne(row.authority) as { name?: string | null } | null;
    const jurisdiction = relationOne(row.jurisdiction) as { name?: string | null } | null;
    const latestVersion = latestVersionBySet.get(String(row.id)) ?? null;
    const activePeriod = activePeriodBySet.get(String(row.id)) ?? null;
    const activeVersion = activePeriod ? versionById.get(String(activePeriod.policy_version_id)) ?? null : null;

    return {
      id: String(row.id),
      authority_id: String(row.authority_id),
      jurisdiction_id: row.jurisdiction_id ? String(row.jurisdiction_id) : null,
      code: String(row.code),
      name: String(row.name),
      description: row.description ? String(row.description) : null,
      policy_domain: String(row.policy_domain),
      status: String(row.status) as PolicyStatus,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      authority_name: authority?.name ? String(authority.name) : null,
      jurisdiction_name: jurisdiction?.name ? String(jurisdiction.name) : null,
      latest_version_label: latestVersion?.version_label ? String(latestVersion.version_label) : null,
      latest_version_status: latestVersion?.status ? (String(latestVersion.status) as PolicyVersionStatus) : null,
      active_version_id: activeVersion?.id ? String(activeVersion.id) : null,
      active_version_label: activeVersion?.version_label ? String(activeVersion.version_label) : null,
      rule_count: activeVersion?.id ? ruleCountByVersion.get(String(activeVersion.id)) ?? 0 : 0,
    } satisfies PolicySetRow;
  });
}

export async function getActivePolicyRules(input: {
  policySetId: string;
  jurisdictionId?: string | null;
  asOf?: string;
}): Promise<PolicyRuleRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("agp_active_policy_version_id", {
    p_policy_set_id: input.policySetId,
    p_jurisdiction_id: input.jurisdictionId ?? null,
    p_as_of: input.asOf ?? new Date().toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
  if (!data) return [];

  return listPolicyRules(String(data));
}
