import Link from "next/link";
import { formatDateTime, notificationBadgeClass, titleCase } from "@/lib/console/mappers";

export type ConsoleNotificationItem = {
  id: string;
  kind: string;
  level: string;
  title: string;
  body: string;
  occurredAt: string;
  href?: string;
  organization?: {
    id: string;
    name: string | null;
    legal_name: string | null;
  } | null;
  metadata?: Record<string, unknown>;
};

export function NotificationFeed({
  notifications,
  emptyText = "No notifications right now.",
}: {
  notifications: ConsoleNotificationItem[];
  emptyText?: string;
}) {
  if (notifications.length === 0) {
    return <div className="muted">{emptyText}</div>;
  }

  return (
    <div className="stack">
      {notifications.map((item) => {
        const content = (
          <div className="notification-card panel-soft" key={item.id}>
            <div className="row-between" style={{ gap: 10 }}>
              <div className="stack" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className={notificationBadgeClass(item.level)}>{titleCase(item.level)}</span>
                  <span className="badge badge-neutral">{titleCase(item.kind)}</span>
                </div>
                <div className="h2" style={{ fontSize: 18 }}>{item.title}</div>
              </div>
              <div className="muted">{formatDateTime(item.occurredAt)}</div>
            </div>

            <div className="muted">{item.body}</div>

            <div className="row-between" style={{ marginTop: 10 }}>
              <div className="muted">
                {item.organization?.legal_name || item.organization?.name || "Platform-wide"}
              </div>
              {item.href ? <span className="badge badge-neutral">Open</span> : null}
            </div>
          </div>
        );

        if (!item.href) return content;
        return (
          <Link key={item.id} href={item.href}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
