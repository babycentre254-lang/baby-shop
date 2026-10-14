import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AccountShell } from "./account-shell";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");
  return <AccountShell user={user}>{children}</AccountShell>;
}
