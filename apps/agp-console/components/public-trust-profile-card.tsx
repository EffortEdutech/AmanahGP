import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { PublicTrustProfileRow } from "@/lib/console/public-trust-profiles";

function badgeClass(value: string) {
  if (value === "exemplary" || value === "approved") return "badge badge-green";
  if (value === "assured") return "badge badge-blue";
  if (value === "developing" || value === "reviewed") return "badge badge-amber";
  if (value === "watchlist" || value === "rejected" || value === "suspended") return "badge badge-red";
  return "badge badge-neutral";
}

export function PublicTrustProfileCard({ profile }: { profile: PublicTrustProfileRow }) {
  return (
    <section className="panel section stack">
      <div style={{ display: "grid", gap: 8 }}>
        <div className="h2">{profile.organization_name}</div>
        <div className="muted">This is the donor-facing trust profile preview derived from the current published trust snapshot.</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span className={badgeClass(profile.trust_level)}>{titleCase(profile.trust_level)}</span>
        <span className={badgeClass(profile.verification_badge)}>{titleCase(profile.verification_badge.replaceAll("_", " "))}</span>
        <span className={badgeClass(profile.governance_status)}>{titleCase(profile.governance_status.replaceAll("_", " "))}</span>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="panel-muted">
          <div className="muted">Registration</div>
          <div>{profile.registration_no || "—"}</div>
        </div>
        <div className="panel-muted">
          <div className="muted">Published</div>
          <div>{profile.published_at ? formatDateTime(profile.published_at) : "—"}</div>
        </div>
        <div className="panel-muted">
          <div className="muted">Location</div>
          <div>{[profile.state, profile.country].filter(Boolean).join(", ") || "—"}</div>
        </div>
        <div className="panel-muted">
          <div className="muted">Website</div>
          <div>{profile.website_url || "—"}</div>
        </div>
      </div>

      <div className="panel-muted stack">
        <div className="muted">Public summary</div>
        <div>{profile.public_summary}</div>
      </div>

      <div className="panel-muted stack">
        <div className="muted">Public highlights</div>
        {profile.public_highlights.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {profile.public_highlights.map((item, index) => (
              <li key={`${profile.organization_id}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <div>—</div>
        )}
      </div>

      <div className="panel-muted stack">
        <div className="muted">Enabled apps</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {profile.enabled_app_keys.length > 0 ? profile.enabled_app_keys.map((appKey) => (
            <span key={appKey} className="badge badge-neutral">{appKey}</span>
          )) : <div>—</div>}
        </div>
      </div>
    </section>
  );
}
