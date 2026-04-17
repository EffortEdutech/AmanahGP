"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireConsoleAccess } from "@/lib/console/access";
import { writeAuditLog } from "@/lib/console/server";

const subscriptionSchema = z.object({
  org_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  billing_cycle: z.enum(["monthly", "yearly"]),
  status: z.enum(["draft", "active", "past_due", "cancelled"]),
  amount: z.coerce.number().nonnegative(),
  currency_code: z.string().trim().length(3),
  seats_included: z.coerce.number().int().nonnegative(),
  seats_used: z.coerce.number().int().nonnegative(),
  starts_at: z.string().trim().min(1),
  next_billing_at: z.string().trim().optional().transform((value) => value || null),
  notes: z.string().trim().optional().transform((value) => value || null),
});

const billingRecordSchema = z.object({
  org_id: z.string().uuid(),
  invoice_ref: z.string().trim().min(1),
  billing_period_label: z.string().trim().min(1),
  amount: z.coerce.number().nonnegative(),
  currency_code: z.string().trim().length(3),
  status: z.enum(["pending", "issued", "paid", "void"]),
  billed_at: z.string().trim().min(1),
  notes: z.string().trim().optional().transform((value) => value || null),
});

export async function upsertSubscriptionAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("billing.write");
  const parsed = subscriptionSchema.safeParse({
    org_id: formData.get("org_id"),
    plan_id: formData.get("plan_id"),
    billing_cycle: formData.get("billing_cycle"),
    status: formData.get("status"),
    amount: formData.get("amount"),
    currency_code: formData.get("currency_code"),
    seats_included: formData.get("seats_included"),
    seats_used: formData.get("seats_used"),
    starts_at: formData.get("starts_at"),
    next_billing_at: formData.get("next_billing_at"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/organisations/${formData.get("org_id")}/billing?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`);
  }

  const payload = parsed.data;
  const { data: existing } = await supabase
    .from("organization_subscriptions")
    .select("id")
    .eq("organization_id", payload.org_id)
    .maybeSingle();

  const record = {
    organization_id: payload.org_id,
    plan_id: payload.plan_id,
    billing_cycle: payload.billing_cycle,
    status: payload.status,
    amount: payload.amount,
    currency_code: payload.currency_code.toUpperCase(),
    seats_included: payload.seats_included,
    seats_used: payload.seats_used,
    starts_at: payload.starts_at,
    next_billing_at: payload.next_billing_at,
    notes: payload.notes,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing?.id
    ? await supabase.from("organization_subscriptions").update(record).eq("id", existing.id)
    : await supabase.from("organization_subscriptions").insert(record);

  if (error) {
    redirect(`/organisations/${payload.org_id}/billing?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization_subscription.saved",
    entityTable: "organization_subscriptions",
    organizationId: payload.org_id,
    metadata: { billing_cycle: payload.billing_cycle, status: payload.status, amount: payload.amount },
  });

  revalidatePath(`/organisations/${payload.org_id}/billing`);
  redirect(`/organisations/${payload.org_id}/billing`);
}

export async function createBillingRecordAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("billing.write");
  const parsed = billingRecordSchema.safeParse({
    org_id: formData.get("org_id"),
    invoice_ref: formData.get("invoice_ref"),
    billing_period_label: formData.get("billing_period_label"),
    amount: formData.get("amount"),
    currency_code: formData.get("currency_code"),
    status: formData.get("status"),
    billed_at: formData.get("billed_at"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect(`/organisations/${formData.get("org_id")}/billing?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid form")}`);
  }

  const payload = parsed.data;

  const { error } = await supabase.from("organization_billing_records").insert({
    organization_id: payload.org_id,
    invoice_ref: payload.invoice_ref,
    billing_period_label: payload.billing_period_label,
    amount: payload.amount,
    currency_code: payload.currency_code.toUpperCase(),
    status: payload.status,
    billed_at: payload.billed_at,
    notes: payload.notes,
  });

  if (error) {
    redirect(`/organisations/${payload.org_id}/billing?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization_billing_record.created",
    entityTable: "organization_billing_records",
    organizationId: payload.org_id,
    metadata: { invoice_ref: payload.invoice_ref, status: payload.status, amount: payload.amount },
  });

  revalidatePath(`/organisations/${payload.org_id}/billing`);
  redirect(`/organisations/${payload.org_id}/billing`);
}

export async function updateBillingRecordStatusAction(formData: FormData) {
  const { supabase, user } = await requireConsoleAccess("billing.write");
  const orgId = String(formData.get("org_id") ?? "");
  const recordId = String(formData.get("record_id") ?? "");
  const status = String(formData.get("status") ?? "pending");

  if (!orgId || !recordId) {
    redirect("/organisations?error=Missing billing record reference");
  }

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "paid") {
    patch.paid_at = new Date().toISOString();
  }

  const { error } = await supabase.from("organization_billing_records").update(patch).eq("id", recordId);

  if (error) {
    redirect(`/organisations/${orgId}/billing?error=${encodeURIComponent(error.message)}`);
  }

  await writeAuditLog(supabase, user.id, {
    action: "organization_billing_record.status_updated",
    entityTable: "organization_billing_records",
    entityId: recordId,
    organizationId: orgId,
    metadata: { status },
  });

  revalidatePath(`/organisations/${orgId}/billing`);
  redirect(`/organisations/${orgId}/billing`);
}
