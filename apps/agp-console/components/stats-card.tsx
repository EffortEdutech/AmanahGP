import { titleCase } from "@/lib/console/mappers";

interface StatsCardProps {
  label: string;
  value: string | number;
  note?: string;
  accent?: "green" | "blue" | "amber" | "purple";
}

const accentColors: Record<string, { bar: string; bg: string; text: string }> = {
  green:  { bar: "#047857", bg: "#ecfdf5",  text: "#047857" },
  blue:   { bar: "#2563eb", bg: "#eff6ff",  text: "#2563eb" },
  amber:  { bar: "#d97706", bg: "#fffbeb",  text: "#d97706" },
  purple: { bar: "#7c3aed", bg: "#f5f3ff",  text: "#7c3aed" },
};

export function StatsCard({ label, value, note, accent = "green" }: StatsCardProps) {
  const colors = accentColors[accent] ?? accentColors.green;
  return (
    <div
      className="panel stats-card"
      style={{ borderTop: `3px solid ${colors.bar}`, position: "relative", overflow: "hidden" }}
    >
      {/* Subtle tint strip in top-right */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        width: 64, height: 64, borderRadius: "0 0 0 64px",
        background: colors.bg, opacity: 0.6,
      }} />

      <div style={{ position: "relative" }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: colors.text,
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10,
        }}>
          {titleCase(label)}
        </div>
        <div className="stat-val">{value}</div>
        {note ? (
          <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}
