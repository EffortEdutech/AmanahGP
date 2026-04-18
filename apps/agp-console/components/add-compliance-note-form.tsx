export function AddComplianceNoteForm({
  orgId,
  returnTo,
  action,
}: {
  orgId: string;
  returnTo: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form className="stack" action={action}>
      <input type="hidden" name="org_id" value={orgId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <div className="field">
        <label htmlFor="note">Internal review note</label>
        <textarea
          id="note"
          name="note"
          className="textarea"
          rows={4}
          placeholder="Add a platform review note for compliance follow-up, verification context, or regulator prep."
          required
        />
      </div>
      <div className="row">
        <button className="btn btn-primary" type="submit">Save review note</button>
      </div>
    </form>
  );
}
