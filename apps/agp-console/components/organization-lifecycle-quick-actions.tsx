const ACTIONS = [
  { value: "submit", label: "Submit for review" },
  { value: "request_changes", label: "Request changes" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "list", label: "List publicly" },
  { value: "unlist", label: "Move to unlisted" },
  { value: "suspend_listing", label: "Suspend listing" },
  { value: "reset_to_draft", label: "Reset to draft" },
] as const;

export function OrganizationLifecycleQuickActions({
  orgId,
  action,
}: {
  orgId: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="stack">
      <div className="muted">Preset transitions for faster console operations.</div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {ACTIONS.map((item) => (
          <form key={item.value} action={action}>
            <input type="hidden" name="org_id" value={orgId} />
            <input type="hidden" name="transition" value={item.value} />
            <button className="btn btn-secondary" type="submit">{item.label}</button>
          </form>
        ))}
      </div>
    </div>
  );
}
