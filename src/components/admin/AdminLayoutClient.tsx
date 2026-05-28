import { ReactNode } from "react";
import { AdminSidebar, AdminTopBar, MobileAdminNav } from "./AdminShell";

interface AdminShellProps {
  children: ReactNode;
  username: string;
  email: string;
  openTicketCount?: number;
}

export function AdminShell({ children, username, email, openTicketCount = 0 }: AdminShellProps) {
  return (
    <div className="admin-app">
      <AdminSidebar openTicketCount={openTicketCount} />
      <div className="admin-main">
        <AdminTopBar username={username} email={email} openTicketCount={openTicketCount} />
        <MobileAdminNav openTicketCount={openTicketCount} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
