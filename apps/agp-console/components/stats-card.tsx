import { titleCase } from "@/lib/console/mappers";

export function StatsCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="panel stats-card">
      <div className="muted" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {titleCase(label)}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 10 }}>{value}</div>
      {note ? <div className="muted" style={{ marginTop: 8 }}>{note}</div> : null}
    </div>
  );
}
