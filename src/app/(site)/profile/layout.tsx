import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ProfileShell } from "@/components/profile/ProfileShell";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ProfileShell>{children}</ProfileShell>;
}
