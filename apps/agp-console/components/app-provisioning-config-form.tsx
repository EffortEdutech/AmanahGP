export function AppProvisioningConfigForm({
  orgId,
  appId,
  config,
  action,
}: {
  orgId: string;
  appId: string;
  config: Record<string, any> | null | undefined;
  action: (formData: FormData) => Promise<void>;
}) {
  const workspaceSlug = typeof config?.workspace_slug === "string" ? config.workspace_slug : "";
  const workspaceUrl = typeof config?.workspace_url === "string" ? config.workspace_url : "";
  const seatsAllocated = typeof config?.seats_allocated === "number" ? String(config.seats_allocated) : "";
  const featureFlags = Array.isArray(config?.feature_flags) ? config.feature_flags.join(", ") : "";
  const notes = typeof config?.notes === "string" ? config.notes : "";

  return (
    <form className="stack" action={action}>
      <input type="hidden" name="org_id" value={orgId} />
      <input type="hidden" name="app_id" value={appId} />

      <div className="grid-2">
        <div className="field">
          <label htmlFor={`workspace_slug_${appId}`}>Workspace slug</label>
          <input id={`workspace_slug_${appId}`} name="workspace_slug" className="input" defaultValue={workspaceSlug} placeholder="masjid-solatiah" />
        </div>

        <div className="field">
          <label htmlFor={`workspace_url_${appId}`}>Workspace URL</label>
          <input id={`workspace_url_${appId}`} name="workspace_url" className="input" defaultValue={workspaceUrl} placeholder="https://org.example.com" />
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor={`seats_allocated_${appId}`}>Seats allocated</label>
          <input id={`seats_allocated_${appId}`} name="seats_allocated" className="input" defaultValue={seatsAllocated} placeholder="10" inputMode="numeric" />
        </div>

        <div className="field">
          <label htmlFor={`feature_flags_${appId}`}>Feature flags</label>
          <input id={`feature_flags_${appId}`} name="feature_flags" className="input" defaultValue={featureFlags} placeholder="reports, governance, api" />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`notes_${appId}`}>Provisioning notes</label>
        <textarea id={`notes_${appId}`} name="notes" className="textarea" rows={3} defaultValue={notes} placeholder="Workspace provisioning notes, special access, migration context, or support remarks." />
      </div>

      <div className="row">
        <button className="btn btn-secondary" type="submit">Save provisioning config</button>
      </div>
    </form>
  );
}
