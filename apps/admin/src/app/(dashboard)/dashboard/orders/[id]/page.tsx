import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ordersServerApi } from "@/lib/api/endpoints.server";
import { OrderDetail } from "./order-detail";
import type { Order } from "@baby-shop/shared";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Order Details" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminPermission("orders.view");
  const { id } = await params;

  let order: Order | null = null;
  try {
    const res = await ordersServerApi.getOne(id);
    order = res.order;
  } catch (err) {
    console.error("[admin order detail] failed:", err);
    notFound();
  }

  if (!order) notFound();

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={`Placed by ${order.shippingAddress.fullName}`}
      />
      <OrderDetail order={order} canManage={hasAdminPermission(user, "orders.manage")} />
    </div>
  );
}
