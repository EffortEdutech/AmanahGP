import { recordGovernanceCaseDecisionAction } from "@/app/(console)/cases/decision-actions";

const STAGE_OPTIONS = [
  { value: "reviewer", label: "Reviewer" },
  { value: "scholar", label: "Scholar" },
  { value: "approver", label: "Approver" },
] as const;

const DECISION_OPTIONS = [
  { value: "advance_to_scholar", label: "Reviewer → Send to scholar" },
  { value: "advance_to_approval", label: "Scholar → Send to approval" },
  { value: "approve", label: "Approver → Approve" },
  { value: "approve_conditional", label: "Approver → Approve with conditions" },
  { value: "improvement_required", label: "Any stage → Improvement required" },
  { value: "reject", label: "Any stage → Reject" },
  { value: "expire", label: "Approver → Expire" },
] as const;

export function GovernanceCaseDecisionForm({
  caseId,
  currentStatus,
}: {
  caseId: string;
  currentStatus: string;
}) {
  const defaultStage = currentStatus === "scholar_review"
    ? "scholar"
    : currentStatus === "approval_pending"
      ? "approver"
      : "reviewer";

  return (
    <form className="stack" action={recordGovernanceCaseDecisionAction}>
      <input type="hidden" name="case_id" value={caseId} />

      <div className="notice">
        Formal decisions are recorded here for reviewer, scholar, and approver workflow. Terminal decisions also emit a donor-facing governance trust event.
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label">Decision stage</label>
          <select className="select" name="decision_stage" defaultValue={defaultStage}>
            {STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Decision</label>
          <select className="select" name="decision" defaultValue="advance_to_scholar">
            {DECISION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Decision note</label>
        <textarea className="textarea" name="decision_note" rows={5} placeholder="Write the reviewer / scholar / approver note here." />
      </div>

      <div className="field">
        <label className="label">Conditions / corrective requirements</label>
        <textarea className="textarea" name="conditions_text" rows={4} placeholder="Use this for conditional approval or improvement requirements." />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Record formal decision</button>
      </div>
    </form>
  );
}
