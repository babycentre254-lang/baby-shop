import { PageHeader } from "@/components/dashboard/page-header";
import { adminServerApi } from "@/lib/api/endpoints.server";
import { AnalyticsPanel } from "./panel";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Analytics" };
export default async function AnalyticsPage() {
  await requireAdminPermission("dashboard.view");
  let data: any = { summary: {}, dailySales: [], topProducts: [], recentOrders: [] };
  try { data = await adminServerApi.analytics(); } catch { /* API availability is shown in the panel. */ }
  return <><PageHeader title="Analytics" subtitle="Sales and store performance at a glance" /><AnalyticsPanel initialData={data} /></>;
}
