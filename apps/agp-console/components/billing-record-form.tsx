import { BILLING_RECORD_STATUS_OPTIONS } from "@/lib/console/constants";

export function BillingRecordForm({ orgId, action }: { orgId: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="panel section stack">
      <input type="hidden" name="org_id" value={orgId} />
      <div className="h2">Create billing record</div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="invoice_ref">Invoice ref</label>
          <input className="input" id="invoice_ref" name="invoice_ref" required />
        </div>
        <div className="field">
          <label htmlFor="billing_period_label">Billing period</label>
          <input className="input" id="billing_period_label" name="billing_period_label" placeholder="Apr 2026" required />
        </div>
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <input className="input" id="amount" name="amount" type="number" step="0.01" required />
        </div>
        <div className="field">
          <label htmlFor="currency_code">Currency</label>
          <input className="input" id="currency_code" name="currency_code" defaultValue="MYR" maxLength={3} required />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select className="select" id="status" name="status" defaultValue="pending">
            {BILLING_RECORD_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="billed_at">Billed at</label>
          <input className="input" id="billed_at" name="billed_at" type="date" required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea className="textarea" id="notes" name="notes" />
      </div>
      <button className="btn btn-primary" type="submit">Create billing record</button>
    </form>
  );
}
