import { submitCaseDecisionAction } from "@/app/(console)/cases/[caseId]/decision/actions";

const DECISION_OPTIONS: Record<string, { value: string; label: string }[]> = {
  reviewer: [
    { value: "advance_to_scholar", label: "Advance to scholar" },
    { value: "advance_to_approval", label: "Advance to approval" },
    { value: "improvement_required", label: "Improvement required" },
    { value: "reject", label: "Reject" },
  ],
  scholar: [
    { value: "advance_to_approval", label: "Advance to approval" },
    { value: "improvement_required", label: "Improvement required" },
    { value: "reject", label: "Reject" },
  ],
  approver: [
    { value: "approve", label: "Approve" },
    { value: "approve_conditional", label: "Approve with conditions" },
    { value: "improvement_required", label: "Improvement required" },
    { value: "reject", label: "Reject" },
    { value: "expire", label: "Expire" },
  ],
};

export function CaseDecisionForm({
  caseId,
  assignmentRole,
}: {
  caseId: string;
  assignmentRole: string | null;
}) {
  const stage = assignmentRole ?? "approver";
  const options = DECISION_OPTIONS[stage] ?? DECISION_OPTIONS.approver;

  return (
    <section className="panel section stack">
      <div className="h2">Decision workspace</div>
      <div className="muted">
        Record the formal case decision. This updates the canonical case status and writes to the governance decision register.
      </div>
      <form action={submitCaseDecisionAction} className="form-grid">
        <input type="hidden" name="case_id" value={caseId} />
        <input type="hidden" name="decision_stage" value={stage} />

        <label className="field">
          <span>Decision stage</span>
          <input readOnly value={stage} />
        </label>

        <label className="field">
          <span>Decision</span>
          <select name="decision" defaultValue={options[0].value} required>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="field field-full">
          <span>Decision note</span>
          <textarea name="decision_note" rows={4} placeholder="Why this case should advance, approve, reject, or require improvement" />
        </label>

        <label className="field field-full">
          <span>Conditions / approval note</span>
          <textarea name="conditions_text" rows={4} placeholder="Conditions, caveats, remediation prerequisites, or publication note" />
        </label>

        <div className="field-full">
          <button className="btn-primary" type="submit">Submit decision</button>
        </div>
      </form>
    </section>
  );
}
