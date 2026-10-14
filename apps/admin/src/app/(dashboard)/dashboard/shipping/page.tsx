import { PageHeader } from "@/components/dashboard/page-header";
import { shippingServerApi } from "@/lib/api/endpoints.server";
import { ShippingZonesPanel } from "./shipping-zones-panel";
import type { ShippingZone } from "@baby-shop/shared";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Shipping zones" };

export default async function ShippingPage() {
  const user = await requireAdminPermission("shipping.view");
  let zones: ShippingZone[] = [];
  let loadError = "";
  try {
    zones = (await shippingServerApi.list()).items;
  } catch (error) {
    console.error("[admin shipping] failed to load:", error);
    loadError = error instanceof Error ? error.message : "Could not load shipping zones.";
  }

  return <div>
    <PageHeader title="Shipping zones" subtitle="Set delivery rates by county. Checkout uses these same active zones to quote shipping." />
    <ShippingZonesPanel initialZones={zones} initialError={loadError} canManage={hasAdminPermission(user, "shipping.manage")} />
  </div>;
}
