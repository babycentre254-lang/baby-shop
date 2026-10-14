import { getCurrentUser } from "@/lib/auth/session";
import { AccountSettingsForm } from "./settings-form";

export const metadata = { title: "Account Settings" };

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  return <AccountSettingsForm user={user}/>;
}
