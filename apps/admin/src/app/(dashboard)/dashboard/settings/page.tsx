import { PageHeader } from "@/components/dashboard/page-header";
import { adminServerApi } from "@/lib/api/endpoints.server";
import { SettingsForm } from "./settings-form";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";
export const metadata = { title: "Store settings" };
export default async function SettingsPage() { const user = await requireAdminPermission("settings.view"); let settings: any = { storeName: "Baby Shop", currency: "KES", timezone: "Africa/Nairobi", supportEmail: "", supportPhone: "", lowStockThreshold: 5, maintenanceMode: false, cashOnDeliveryEnabled: true }; try { settings = (await adminServerApi.settings()).settings; } catch { /* Defaults allow the page to render while API is offline. */ } return <><PageHeader title="Store settings" subtitle="Store identity, contact details, payments and operations defaults" /><SettingsForm initialSettings={settings} canManage={hasAdminPermission(user, "settings.manage")}/></>; }
