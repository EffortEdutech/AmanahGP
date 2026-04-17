import { ConsoleShell } from "@/components/console-shell";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatMoney, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import { listBillingPlans } from "@/lib/console/server";

export default async function PlansPage() {
  const { user, roles } = await requireConsoleAccess("billing.read");
  const plans = await listBillingPlans();

  return (
    <ConsoleShell
      title="Plans & Billing"
      description="Reusable plan catalog from public.billing_plans for organisation subscriptions."
      currentPath="/plans"
      roles={roles}
      userEmail={user.email}
    >
      <section className="panel section stack">
        <div className="h2">Billing plans</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Status</th>
                <th>Monthly</th>
                <th>Yearly</th>
                <th>Features</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan: any) => (
                <tr key={plan.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{plan.plan_name}</div>
                    <div className="muted">{plan.plan_key}</div>
                  </td>
                  <td><span className={statusBadgeClass(plan.status)}>{titleCase(plan.status)}</span></td>
                  <td>{formatMoney(plan.monthly_amount)}</td>
                  <td>{formatMoney(plan.yearly_amount)}</td>
                  <td>
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: "#c7d6ea" }}>{JSON.stringify(plan.features, null, 2)}</pre>
                  </td>
                </tr>
              ))}
              {plans.length === 0 ? <tr><td colSpan={5} className="muted">No billing plans yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </ConsoleShell>
  );
}
