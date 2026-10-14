import { adminServerApi } from "@/lib/api/endpoints.server";
import { getCurrentUser, requireAdminPermission } from "@/lib/auth/session";
import { DashboardOverview } from "./dashboard-overview";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireAdminPermission("dashboard.view");
  const [user, report] = await Promise.all([
    getCurrentUser(),
    adminServerApi.analytics(30).catch(() => null),
  ]);

  return <DashboardOverview userName={user?.firstName ?? "there"} initialReport={report} />;
}
