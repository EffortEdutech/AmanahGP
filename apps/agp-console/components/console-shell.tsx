import { getPrimaryRoleLabel } from "@/lib/console/access";
import { ConsoleLayoutClient } from "@/components/console-layout-client";

type ConsoleShellProps = {
  title: string;
  description?: string;
  currentPath: string;
  roles: string[];
  userEmail?: string | null;
  children: React.ReactNode;
};

export function ConsoleShell({ title, description, currentPath, roles, userEmail, children }: ConsoleShellProps) {
  const roleLabel = getPrimaryRoleLabel(roles);

  return (
    <ConsoleLayoutClient
      title={title}
      description={description}
      currentPath={currentPath}
      roleLabel={roleLabel}
      userEmail={userEmail}
    >
      {children}
    </ConsoleLayoutClient>
  );
}
