import { PageHeader } from "@/components/dashboard/page-header";
import { ordersServerApi } from "@/lib/api/endpoints.server";
import { OrdersTable } from "./orders-table";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireAdminPermission("orders.view");
  const ordersRes = await ordersServerApi
    .listAll({ pageSize: 100, sort: "-createdAt" })
    .catch((err) => {
      console.error("[admin orders] failed to load:", err);
      return { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 };
    });

  const orders = (ordersRes as any).items ?? [];
  const total = (ordersRes as any).total ?? 0;

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${total} ${
          total === 1 ? "order" : "orders"
        } placed orders. Unpaid M-Pesa checkouts are tracked separately.`}
        actions={hasAdminPermission(user, "checkouts.view") ? <Link href="/dashboard/orders/checkouts" className="inline-flex h-10 items-center gap-2 rounded-xl border border-cream-300 bg-white px-4 text-sm font-semibold text-ink-700 hover:bg-cream-50">Checkout sessions <ArrowUpRight className="h-4 w-4" /></Link> : undefined}
      />
      <OrdersTable initialOrders={orders} canManage={hasAdminPermission(user, "orders.manage")} />
    </div>
  );
}
