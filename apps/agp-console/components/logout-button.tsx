import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button className="btn btn-secondary" type="submit">
        <LogOut size={16} />
        Sign out
      </button>
    </form>
  );
}
