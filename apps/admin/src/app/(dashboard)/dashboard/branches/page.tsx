import { PageHeader } from "@/components/dashboard/page-header";
import { adminServerApi } from "@/lib/api/endpoints.server";
import { BranchesPanel } from "./panel";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";
export const metadata = { title: "Branches" };
export default async function BranchesPage() { const user = await requireAdminPermission("branches.view"); let branches: any[] = []; try { branches = (await adminServerApi.branches()).branches; } catch { /* Empty state handles service availability. */ } return <><PageHeader title="Branches" subtitle="Manage store locations and contact details" /><BranchesPanel initialBranches={branches ?? []} canManage={hasAdminPermission(user, "branches.manage")}/></>; }
