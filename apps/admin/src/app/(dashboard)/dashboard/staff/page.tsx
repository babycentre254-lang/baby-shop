import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { adminServerApi } from "@/lib/api/endpoints.server";
import { getCurrentUser } from "@/lib/auth/session";
import { StaffPanel } from "./panel";
export const metadata = { title: "Staff & Roles" };
export default async function StaffPage() { const user = await getCurrentUser(); if (user?.role !== "SUPER_ADMIN") redirect("/dashboard"); let staff: any[] = []; try { staff = (await adminServerApi.staff()).items; } catch { /* Empty state shown below. */ } return <><PageHeader title="Staff & roles" subtitle="Manage administrator access to the store" /><StaffPanel initialStaff={staff ?? []} canManage currentUserId={user._id}/></>; }
