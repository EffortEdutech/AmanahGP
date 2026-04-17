export function formatMoney(value: number | string | null | undefined, currency = "MYR") {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: undefined,
  }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function statusBadgeClass(status: string | null | undefined) {
  const normalized = String(status ?? "").toLowerCase();
  if (["active", "approved", "listed", "enabled", "paid", "accepted"].includes(normalized)) {
    return "badge";
  }
  if (["suspended", "rejected", "void", "revoked", "cancelled", "past_due"].includes(normalized)) {
    return "badge badge-danger";
  }
  if (["submitted", "changes_requested", "pending", "issued", "draft", "private", "archived"].includes(normalized)) {
    return "badge badge-warning";
  }
  return "badge badge-neutral";
}

export function titleCase(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
