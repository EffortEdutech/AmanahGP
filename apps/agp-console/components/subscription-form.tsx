import { BILLING_CYCLE_OPTIONS, SUBSCRIPTION_STATUS_OPTIONS } from "@/lib/console/constants";

export function SubscriptionForm({
  orgId,
  plans,
  subscription,
  action,
}: {
  orgId: string;
  plans: Array<any>;
  subscription: any;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="panel section stack">
      <input type="hidden" name="org_id" value={orgId} />
      <div className="h2">Subscription</div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="plan_id">Plan</label>
          <select className="select" id="plan_id" name="plan_id" defaultValue={subscription?.plan_id ?? plans[0]?.id ?? ""} required>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.plan_name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="billing_cycle">Billing cycle</label>
          <select className="select" id="billing_cycle" name="billing_cycle" defaultValue={subscription?.billing_cycle ?? "monthly"}>
            {BILLING_CYCLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select className="select" id="status" name="status" defaultValue={subscription?.status ?? "draft"}>
            {SUBSCRIPTION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input className="input" id="amount" name="amount" type="number" step="0.01" defaultValue={subscription?.amount ?? 0} required />
        </div>

        <div className="field">
          <label htmlFor="currency_code">Currency</label>
          <input className="input" id="currency_code" name="currency_code" defaultValue={subscription?.currency_code ?? "MYR"} maxLength={3} required />
        </div>

        <div className="field">
          <label htmlFor="seats_included">Seats included</label>
          <input className="input" id="seats_included" name="seats_included" type="number" defaultValue={subscription?.seats_included ?? 1} required />
        </div>

        <div className="field">
          <label htmlFor="seats_used">Seats used</label>
          <input className="input" id="seats_used" name="seats_used" type="number" defaultValue={subscription?.seats_used ?? 0} required />
        </div>

        <div className="field">
          <label htmlFor="starts_at">Starts at</label>
          <input className="input" id="starts_at" name="starts_at" type="date" defaultValue={subscription?.starts_at?.slice(0, 10) ?? ""} required />
        </div>

        <div className="field">
          <label htmlFor="next_billing_at">Next billing at</label>
          <input className="input" id="next_billing_at" name="next_billing_at" type="date" defaultValue={subscription?.next_billing_at?.slice(0, 10) ?? ""} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea className="textarea" id="notes" name="notes" defaultValue={subscription?.notes ?? ""} />
      </div>

      <button className="btn btn-primary" type="submit">Save subscription</button>
    </form>
  );
}
