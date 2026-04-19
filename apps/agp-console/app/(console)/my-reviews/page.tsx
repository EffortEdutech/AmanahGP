import { ConsoleShell } from "@/components/console-shell";
import { MyReviewInboxTable } from "@/components/my-review-inbox-table";
import { requireConsoleAccess } from "@/lib/console/access";
import { listMyReviewInbox } from "@/lib/console/my-reviews";

export default async function MyReviewsPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const rows = await listMyReviewInbox(user.id);

  return (
    <ConsoleShell
      title="My Reviews"
      description="Your assigned governance review work. Accept assignments, open the case, and mark your review stage complete."
      currentPath="/my-reviews"
      roles={roles}
      userEmail={user.email}
    >
      <MyReviewInboxTable rows={rows} />
    </ConsoleShell>
  );
}
