import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";
import { NewSalePanel } from "./panel";

export const metadata = { title: "New Sale" };

export default async function NewSalePage() {
  const user = await getCurrentUser();
  if (!user || !hasAdminPermission(user, "orders.manage")) redirect("/dashboard");
  return <><PageHeader title="New sale" subtitle="Build an in-store sale, collect cash or request M-Pesa, and record completed sales with delivered orders." /><NewSalePanel /></>;
}
