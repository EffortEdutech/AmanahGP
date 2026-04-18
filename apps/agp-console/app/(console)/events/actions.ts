"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

const intakeActionSchema = z.object({
  intake_id: z.string().uuid(),
});

function encodeMessage(value: string) {
  return encodeURIComponent(value);
}

function makeCaseCode() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GRC-${yyyy}${mm}${dd}-${rand}`;
}

function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCaseSummaryFromEvent(row: {
  event_type: string;
  pillar: string | null;
  payload: Record<string, unknown> | null;
  organization_id: string;
}) {
  const payload = row.payload ?? {};
  const hints = ["period", "amount", "currency", "policy_name", "payment_id", "account_name", "note"]
    .map((key) => {
      const value = payload[key];
      return value === undefined || value === null ? null : `${key}: ${String(value)}`;
    })
    .filter((value): value is string => Boolean(value));

  const headline = `Triggered from trust event ${labelize(row.event_type)}${row.pillar ? ` (${labelize(row.pillar)})` : ""}.`;
  const detail = hints.length > 0 ? ` Snapshot: ${hints.join(" · ")}.` : "";
  return `${headline}${detail}`;
}

export async function openCaseFromEventAction(formData: FormData) {
  const parsed = intakeActionSchema.safeParse({
    intake_id: formData.get("intake_id"),
  });

  if (!parsed.success) {
    redirect(`/events?error=${encodeMessage("Invalid intake request.")}`);
  }

  const { supabase, user } = await requireConsoleAccess("cases.write");
  const intakeId = parsed.data.intake_id;

  const { data: intake, error: intakeError } = await supabase
    .from("governance_event_intake")
    .select(
      "id, trust_event_id, organization_id, event_type, pillar, payload, routing_mode, suggested_case_type, suggested_priority, intake_status, linked_case_id",
    )
    .eq("id", intakeId)
    .single();

  if (intakeError || !intake) {
    redirect(`/events?error=${encodeMessage(intakeError?.message ?? "Event intake row not found.")}`);
  }

  if (intake.linked_case_id) {
    redirect(`/cases/${intake.linked_case_id}?message=${encodeMessage("Event already linked to a case.")}`);
  }

  if (String(intake.intake_status) !== "pending") {
    redirect(`/events?error=${encodeMessage("Only pending event intake rows can open a case.")}`);
  }

  const caseCode = makeCaseCode();
  const summary = buildCaseSummaryFromEvent({
    event_type: String(intake.event_type),
    pillar: intake.pillar ? String(intake.pillar) : null,
    payload: intake.payload as Record<string, unknown> | null,
    organization_id: String(intake.organization_id),
  });

  const { data: newCase, error: caseError } = await supabase
    .from("governance_review_cases")
    .insert({
      case_code: caseCode,
      organization_id: intake.organization_id,
      review_type: intake.suggested_case_type,
      status: "submitted",
      priority: intake.suggested_priority,
      intake_source: "trust_event",
      summary,
      source_event_id: intake.trust_event_id,
      created_by_user_id: user.id,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, case_code")
    .single();

  if (caseError || !newCase) {
    redirect(`/events?error=${encodeMessage(caseError?.message ?? "Failed to open governance case.")}`);
  }

  const { error: updateError } = await supabase
    .from("governance_event_intake")
    .update({
      intake_status: "case_opened",
      linked_case_id: newCase.id,
      handled_by_user_id: user.id,
      handled_at: new Date().toISOString(),
      handler_note: `Case ${newCase.case_code} opened from event intake.`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intakeId);

  if (updateError) {
    redirect(`/events?error=${encodeMessage(updateError.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_event.case_opened",
    entityTable: "governance_event_intake",
    entityId: intakeId,
    organizationId: String(intake.organization_id),
    metadata: {
      event_type: String(intake.event_type),
      trust_event_id: String(intake.trust_event_id),
      governance_case_id: String(newCase.id),
      governance_case_code: String(newCase.case_code),
    },
  });

  revalidatePath("/events");
  revalidatePath("/cases");
  revalidatePath(`/cases/${newCase.id}`);
  revalidatePath(`/organisations/${intake.organization_id}`);
  redirect(`/cases/${newCase.id}?message=${encodeMessage(`Opened ${newCase.case_code} from trust event intake.`)}`);
}

export async function ignoreEventIntakeAction(formData: FormData) {
  const parsed = intakeActionSchema.safeParse({
    intake_id: formData.get("intake_id"),
  });

  if (!parsed.success) {
    redirect(`/events?error=${encodeMessage("Invalid intake request.")}`);
  }

  const { supabase, user } = await requireConsoleAccess("cases.write");
  const intakeId = parsed.data.intake_id;

  const { data: intake, error: intakeError } = await supabase
    .from("governance_event_intake")
    .select("id, organization_id, event_type, intake_status")
    .eq("id", intakeId)
    .single();

  if (intakeError || !intake) {
    redirect(`/events?error=${encodeMessage(intakeError?.message ?? "Event intake row not found.")}`);
  }

  const { error: updateError } = await supabase
    .from("governance_event_intake")
    .update({
      intake_status: "ignored",
      handled_by_user_id: user.id,
      handled_at: new Date().toISOString(),
      handler_note: "Marked ignored from Console event intake.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", intakeId);

  if (updateError) {
    redirect(`/events?error=${encodeMessage(updateError.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "governance_event.ignored",
    entityTable: "governance_event_intake",
    entityId: intakeId,
    organizationId: String(intake.organization_id),
    metadata: {
      event_type: String(intake.event_type),
    },
  });

  revalidatePath("/events");
  revalidatePath(`/organisations/${intake.organization_id}`);
  redirect(`/events?message=${encodeMessage("Event intake row marked as ignored.")}`);
}
