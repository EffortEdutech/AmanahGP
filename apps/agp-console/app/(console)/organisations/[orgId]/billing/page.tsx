import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { BillingRecordForm } from "@/components/billing-record-form";
import { SubscriptionForm } from "@/components/subscription-form";
import {
  createBillingRecordAction,
  updateBillingRecordStatusAction,
  upsertSubscriptionAction,
} from "@/app/(console)/organisations/[orgId]/billing/actions";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDate, formatMoney, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import {
  getOrganizationById,
  getOrganizationSubscription,
  listBillingPlans,
  listOrganizationBillingRecords,
} from "@/lib/console/server";

export default async function OrganizationBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { orgId } = await params;
  const { error } = await searchParams;
  const { user, roles } = await requireConsoleAccess("billing.read");
  const organization = await getOrganizationById(orgId);
  const [plans, subscription, records] = await Promise.all([
    listBillingPlans(),
    getOrganizationSubscription(orgId),
    listOrganizationBillingRecords(orgId),
  ]);

  return (
    <ConsoleShell
      title={`Billing — ${organization.legal_name ?? organization.name}`}
      description="Manage plans, subscription lifecycle, invoice records, and payment tracking using canonical billing tables."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      <div className="row">
        <Link className="btn btn-secondary" href={`/organisations/${orgId}`}>Back to organisation</Link>
      </div>

      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

      <section className="grid-cards">
        <div className="panel section stack">
          <div className="h2">Current subscription</div>
          {subscription ? (
            <>
              <div><strong>Plan:</strong> {(subscription as any).plan?.plan_name || "—"}</div>
              <div><strong>Status:</strong> <span className={statusBadgeClass(subscription.status)}>{titleCase(subscription.status)}</span></div>
              <div><strong>Billing:</strong> {titleCase(subscription.billing_cycle)}</div>
              <div><strong>Amount:</strong> {formatMoney(subscription.amount, subscription.currency_code)}</div>
              <div><strong>Seats:</strong> {subscription.seats_used} / {subscription.seats_included}</div>
              <div><strong>Next billing:</strong> {formatDate(subscription.next_billing_at)}</div>
            </>
          ) : (
            <div className="muted">No subscription yet.</div>
          )}
        </div>

        <div className="panel section stack">
          <div className="h2">Plan catalog</div>
          {plans.map((plan: any) => (
            <div key={plan.id} className="panel-soft section stack">
              <div style={{ fontWeight: 700 }}>{plan.plan_name}</div>
              <div className="muted">{plan.description || "—"}</div>
              <div>{formatMoney(plan.monthly_amount)} / month</div>
              <div>{formatMoney(plan.yearly_amount)} / year</div>
            </div>
          ))}
        </div>
      </section>

      <SubscriptionForm orgId={orgId} plans={plans} subscription={subscription} action={upsertSubscriptionAction} />
      <BillingRecordForm orgId={orgId} action={createBillingRecordAction} />

      <section className="panel section stack">
        <div className="h2">Billing records</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Billed</th>
                <th>Paid</th>
                <th>Quick action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record: any) => (
                <tr key={record.id}>
                  <td>{record.invoice_ref}</td>
                  <td>{record.billing_period_label}</td>
                  <td>{formatMoney(record.amount, record.currency_code)}</td>
                  <td><span className={statusBadgeClass(record.status)}>{titleCase(record.status)}</span></td>
                  <td>{formatDate(record.billed_at)}</td>
                  <td>{formatDate(record.paid_at)}</td>
                  <td>
                    <div className="row">
                      <form action={updateBillingRecordStatusAction}>
                        <input type="hidden" name="org_id" value={orgId} />
                        <input type="hidden" name="record_id" value={record.id} />
                        <input type="hidden" name="status" value="issued" />
                        <button className="btn btn-secondary" type="submit">Mark issued</button>
                      </form>
                      <form action={updateBillingRecordStatusAction}>
                        <input type="hidden" name="org_id" value={orgId} />
                        <input type="hidden" name="record_id" value={record.id} />
                        <input type="hidden" name="status" value="paid" />
                        <button className="btn btn-primary" type="submit">Mark paid</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {records.length === 0 ? (
                <tr><td colSpan={7} className="muted">No billing records yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </ConsoleShell>
  );
}
