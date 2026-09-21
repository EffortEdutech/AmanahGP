import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthorityCorrectiveActionRow = {
  id: string;
  case_id: string;
  case_code: string | null;
  organization_id: string | null;
  organization_name: string | null;
  title: string;
  priority: string;
  status: string;
  assigned_role_label: string | null;
  owner_name: string | null;
  due_at: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthorityActivityRow = {
  id: string;
  action: string;
  entity_table: string | null;
  entity_id: string | null;
  actor_role: string | null;
  organization_name: string | null;
  occurred_at: string;
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listAuthorityCorrectiveActions(limit = 100): Promise<AuthorityCorrectiveActionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("governance_case_action_items")
    .select(`
      id,
      case_id,
      title,
      priority,
      status,
      assigned_role_label,
      owner_name,
      due_at,
      verified_at,
      created_at,
      updated_at,
      case:governance_review_cases!governance_case_action_items_case_id_fkey (
        id,
        case_code,
        organization_id,
        organization:organizations!governance_review_cases_organization_id_fkey (id, name, legal_name)
      )
    `)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const reviewCase = relationOne(row.case) as { case_code?: string | null; organization_id?: string | null; organization?: unknown } | null;
    const organization = relationOne(reviewCase?.organization) as { name?: string | null; legal_name?: string | null } | null;
    return {
      id: String(row.id),
      case_id: String(row.case_id),
      case_code: reviewCase?.case_code ? String(reviewCase.case_code) : null,
      organization_id: reviewCase?.organization_id ? String(reviewCase.organization_id) : null,
      organization_name: organization?.legal_name || organization?.name ? String(organization.legal_name ?? organization.name) : null,
      title: String(row.title),
      priority: String(row.priority),
      status: String(row.status),
      assigned_role_label: row.assigned_role_label ? String(row.assigned_role_label) : null,
      owner_name: row.owner_name ? String(row.owner_name) : null,
      due_at: row.due_at ? String(row.due_at) : null,
      verified_at: row.verified_at ? String(row.verified_at) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  });
}

export async function listAuthorityActivity(limit = 100): Promise<AuthorityActivityRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_table,
      entity_id,
      actor_role,
      occurred_at,
      organization:organizations!audit_logs_organization_id_fkey (id, name, legal_name)
    `)
    .in("entity_table", [
      "regulatory_submissions",
      "authority_obligations",
      "authority_exceptions",
      "authority_evidence_links",
      "authority_evidence_access_logs",
      "governance_review_cases",
      "governance_case_action_items"
    ])
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const organization = relationOne(row.organization) as { name?: string | null; legal_name?: string | null } | null;
    return {
      id: String(row.id),
      action: String(row.action),
      entity_table: row.entity_table ? String(row.entity_table) : null,
      entity_id: row.entity_id ? String(row.entity_id) : null,
      actor_role: row.actor_role ? String(row.actor_role) : null,
      organization_name: organization?.legal_name || organization?.name ? String(organization.legal_name ?? organization.name) : null,
      occurred_at: String(row.occurred_at),
    };
  });
}
