import { submitCaseRecommendationAction } from "@/app/(console)/cases/[caseId]/recommendations/actions";

const RECOMMENDATION_OPTIONS = [
  { value: "approve", label: "Approve" },
  { value: "approve_with_conditions", label: "Approve with conditions" },
  { value: "remediate", label: "Remediate" },
  { value: "reject", label: "Reject" },
  { value: "escalate", label: "Escalate" },
  { value: "info_required", label: "Info required" },
];

export function CaseRecommendationForm({
  caseId,
  assignmentId,
  assignmentRole,
}: {
  caseId: string;
  assignmentId: string | null;
  assignmentRole: string | null;
}) {
  return (
    <section className="panel section stack">
      <div className="h2">Submit recommendation</div>
      <div className="muted">
        Record your reviewer or scholar recommendation for this governance case. The latest submission from the same assignment will supersede the previous one.
      </div>
      <form action={submitCaseRecommendationAction} className="form-grid">
        <input type="hidden" name="case_id" value={caseId} />
        <input type="hidden" name="assignment_id" value={assignmentId ?? ""} />

        <label className="field">
          <span>Assignment role</span>
          <input value={assignmentRole ?? "Unassigned / platform submission"} readOnly />
        </label>

        <label className="field">
          <span>Recommendation</span>
          <select name="recommendation" defaultValue="remediate" required>
            {RECOMMENDATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="field field-full">
          <span>Summary</span>
          <input name="summary" placeholder="Short decision summary" minLength={10} required />
        </label>

        <label className="field field-full">
          <span>Detailed notes</span>
          <textarea name="detailed_notes" rows={6} placeholder="Reasoning, conditions, Shariah note, evidence trail, follow-up, or escalation note" />
        </label>

        <div className="field-full">
          <button className="btn-primary" type="submit">Submit recommendation</button>
        </div>
      </form>
    </section>
  );
}
