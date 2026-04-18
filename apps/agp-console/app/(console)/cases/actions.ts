"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function makeCaseCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `GRC-${date}-${random}`;
}

function dateOnlyToIso(value: string | null) {
  if (!value) return null;
  return `${value}T00:00:00.000Z`;
}

function statusTimestamps(status: string) {
  const now = new Date().toISOString();

  if (status === "submitted") return { submitted_at: now };
  if (status === "under_review") return { review_started_at: now };
  if (status === "scholar_review") return { scholar_started_at: now };
  if (status === "approval_pending") return { approval_started_at: now };
  if (["approved", "improvement_required", "rejected", "expired"].includes(status)) {
    return { closed_at: now };
  }

  return {};
}

export async function createGovernanceCaseAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const organizationId = String(formData.get("organization_id") ?? "").trim();
  const reviewType = String(formData.get("review_type") ?? "governance_review").trim();
  const status = String(formData.get("status") ?? "submitted").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  const dueAt = String(formData.get("due_at") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();

  if (!organizationId) {
    redirect(`/cases/new?error=${encodeMessage("Please select an organisation.")}`);
  }

  const caseCode = makeCaseCode();
  const timestamps = statusTimestamps(status);

  const { data, error } = await supabase
    .from("governance_review_cases")
    .insert({
      case_code: caseCode,
      organization_id: organizationId,
      review_type: reviewType,
      status,
      priority,
      intake_source: "console",
      summary: summary || null,
      due_at: dateOnlyToIso(dueAt),
      created_by_user_id: user.id,
      ...timestamps,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/cases/new?error=${encodeMessage(error?.message ?? "Failed to create case.")}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.created",
    entityTable: "governance_review_cases",
    entityId: data.id,
    organizationId: organizationId,
    metadata: {
      case_code: caseCode,
      review_type: reviewType,
      status,
      priority,
    },
  });

  revalidatePath("/cases");
  revalidatePath(`/organisations/${organizationId}`);
  redirect(`/cases/${data.id}?message=${encodeMessage("Governance review case created.")}`);
}

export async function updateGovernanceCaseAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const caseId = String(formData.get("case_id") ?? "").trim();
  const status = String(formData.get("status") ?? "submitted").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  const outcomeRaw = String(formData.get("outcome") ?? "").trim();
  const dueAt = String(formData.get("due_at") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();

  if (!caseId) {
    redirect(`/cases?error=${encodeMessage("Case ID is missing.")}`);
  }

  const { data: existing, error: existingError } = await supabase
    .from("governance_review_cases")
    .select("id, organization_id, submitted_at, review_started_at, scholar_started_at, approval_started_at, closed_at")
    .eq("id", caseId)
    .single();

  if (existingError || !existing) {
    redirect(`/cases?error=${encodeMessage(existingError?.message ?? "Case not found.")}`);
  }

  const timestampPatch = statusTimestamps(status);
  const payload: Record<string, unknown> = {
    status,
    priority,
    outcome: outcomeRaw || null,
    due_at: dateOnlyToIso(dueAt),
    summary: summary || null,
    updated_at: new Date().toISOString(),
  };

  if (!existing.submitted_at && "submitted_at" in timestampPatch) payload.submitted_at = (timestampPatch as any).submitted_at;
  if (!existing.review_started_at && "review_started_at" in timestampPatch) payload.review_started_at = (timestampPatch as any).review_started_at;
  if (!existing.scholar_started_at && "scholar_started_at" in timestampPatch) payload.scholar_started_at = (timestampPatch as any).scholar_started_at;
  if (!existing.approval_started_at && "approval_started_at" in timestampPatch) payload.approval_started_at = (timestampPatch as any).approval_started_at;
  if ("closed_at" in timestampPatch) payload.closed_at = (timestampPatch as any).closed_at;

  const { error } = await supabase
    .from("governance_review_cases")
    .update(payload)
    .eq("id", caseId);

  if (error) {
    redirect(`/cases/${caseId}?error=${encodeMessage(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.updated",
    entityTable: "governance_review_cases",
    entityId: caseId,
    organizationId: existing.organization_id,
    metadata: {
      status,
      priority,
      outcome: outcomeRaw || null,
    },
  });

  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/organisations/${existing.organization_id}`);
  redirect(`/cases/${caseId}?message=${encodeMessage("Governance case updated.")}`);
}

export async function assignGovernanceCaseAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const caseId = String(formData.get("case_id") ?? "").trim();
  const assigneeUserId = String(formData.get("assignee_user_id") ?? "").trim();
  const assignmentRole = String(formData.get("assignment_role") ?? "reviewer").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!caseId || !assigneeUserId) {
    redirect(`/cases/${caseId}?error=${encodeMessage("Please select an assignee.")}`);
  }

  const { data: existingCase, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, organization_id")
    .eq("id", caseId)
    .single();

  if (caseError || !existingCase) {
    redirect(`/cases?error=${encodeMessage(caseError?.message ?? "Case not found.")}`);
  }

  const { data: existingAssignment, error: findError } = await supabase
    .from("governance_case_assignments")
    .select("id")
    .eq("case_id", caseId)
    .eq("assignee_user_id", assigneeUserId)
    .eq("assignment_role", assignmentRole)
    .maybeSingle();

  if (findError) {
    redirect(`/cases/${caseId}?error=${encodeMessage(findError.message)}`);
  }

  if (existingAssignment?.id) {
    const { error } = await supabase
      .from("governance_case_assignments")
      .update({
        status: "assigned",
        notes: notes || null,
        assigned_by_user_id: user.id,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingAssignment.id);

    if (error) {
      redirect(`/cases/${caseId}?error=${encodeMessage(error.message)}`);
    }
  } else {
    const { error } = await supabase
      .from("governance_case_assignments")
      .insert({
        case_id: caseId,
        assignee_user_id: assigneeUserId,
        assignment_role: assignmentRole,
        status: "assigned",
        notes: notes || null,
        assigned_by_user_id: user.id,
      });

    if (error) {
      redirect(`/cases/${caseId}?error=${encodeMessage(error.message)}`);
    }
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.assignment_saved",
    entityTable: "governance_case_assignments",
    entityId: caseId,
    organizationId: existingCase.organization_id,
    metadata: {
      assignee_user_id: assigneeUserId,
      assignment_role: assignmentRole,
    },
  });

  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?message=${encodeMessage("Case assignment saved.")}`);
}

export async function createGovernanceFindingAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const caseId = String(formData.get("case_id") ?? "").trim();
  const findingType = String(formData.get("finding_type") ?? "governance").trim();
  const severity = String(formData.get("severity") ?? "minor").trim();
  const title = String(formData.get("title") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const recommendation = String(formData.get("recommendation") ?? "").trim();

  if (!caseId || !title) {
    redirect(`/cases/${caseId}?error=${encodeMessage("Finding title is required.")}`);
  }

  const { data: reviewCase, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, organization_id")
    .eq("id", caseId)
    .single();

  if (caseError || !reviewCase) {
    redirect(`/cases?error=${encodeMessage(caseError?.message ?? "Case not found.")}`);
  }

  const { data, error } = await supabase
    .from("governance_case_findings")
    .insert({
      case_id: caseId,
      finding_type: findingType,
      severity,
      status: "open",
      title,
      details: details || null,
      recommendation: recommendation || null,
      recorded_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/cases/${caseId}?error=${encodeMessage(error?.message ?? "Failed to create finding.")}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.finding_created",
    entityTable: "governance_case_findings",
    entityId: data.id,
    organizationId: reviewCase.organization_id,
    metadata: {
      case_id: caseId,
      finding_type: findingType,
      severity,
      title,
    },
  });

  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?message=${encodeMessage("Finding recorded.")}`);
}

export async function updateGovernanceFindingStatusAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const caseId = String(formData.get("case_id") ?? "").trim();
  const findingId = String(formData.get("finding_id") ?? "").trim();
  const status = String(formData.get("status") ?? "open").trim();

  if (!caseId || !findingId) {
    redirect(`/cases/${caseId}?error=${encodeMessage("Finding ID is missing.")}`);
  }

  const { data: finding, error: findingError } = await supabase
    .from("governance_case_findings")
    .select("id, case_id")
    .eq("id", findingId)
    .single();

  if (findingError || !finding) {
    redirect(`/cases/${caseId}?error=${encodeMessage(findingError?.message ?? "Finding not found.")}`);
  }

  const { data: reviewCase } = await supabase
    .from("governance_review_cases")
    .select("organization_id")
    .eq("id", caseId)
    .maybeSingle();

  const { error } = await supabase
    .from("governance_case_findings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", findingId);

  if (error) {
    redirect(`/cases/${caseId}?error=${encodeMessage(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.finding_status_updated",
    entityTable: "governance_case_findings",
    entityId: findingId,
    organizationId: reviewCase?.organization_id ?? null,
    metadata: {
      case_id: caseId,
      status,
    },
  });

  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?message=${encodeMessage("Finding status updated.")}`);
}

export async function createGovernanceEvidenceAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("cases.write");

  const caseId = String(formData.get("case_id") ?? "").trim();
  const findingIdRaw = String(formData.get("finding_id") ?? "").trim();
  const evidenceType = String(formData.get("evidence_type") ?? "note").trim();
  const title = String(formData.get("title") ?? "").trim();
  const evidenceUrl = String(formData.get("evidence_url") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!caseId || !title) {
    redirect(`/cases/${caseId}?error=${encodeMessage("Evidence title is required.")}`);
  }

  const { data: reviewCase, error: caseError } = await supabase
    .from("governance_review_cases")
    .select("id, organization_id")
    .eq("id", caseId)
    .single();

  if (caseError || !reviewCase) {
    redirect(`/cases?error=${encodeMessage(caseError?.message ?? "Case not found.")}`);
  }

  const { data, error } = await supabase
    .from("governance_case_evidence")
    .insert({
      case_id: caseId,
      finding_id: findingIdRaw || null,
      evidence_type: evidenceType,
      title,
      evidence_url: evidenceUrl || null,
      notes: notes || null,
      recorded_by_user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/cases/${caseId}?error=${encodeMessage(error?.message ?? "Failed to save evidence.")}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_case.evidence_created",
    entityTable: "governance_case_evidence",
    entityId: data.id,
    organizationId: reviewCase.organization_id,
    metadata: {
      case_id: caseId,
      finding_id: findingIdRaw || null,
      evidence_type: evidenceType,
      title,
    },
  });

  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?message=${encodeMessage("Evidence saved.")}`);
}
