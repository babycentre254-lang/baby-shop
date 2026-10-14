"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Loader2,
  ArrowRight,
  Search,
  ChevronRight,
  ShoppingBag,
  Clock,
  CreditCard,
} from "lucide-react";
import { ordersApi } from "@/lib/api/endpoints";
import { cn, formatKES, formatDateShort } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./[id]/order-status-badge";
import type { Order, OrderStatus } from "@baby-shop/shared";

type StatusFilter = "all" | "active" | "delivered" | "cancelled";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All orders",
  active: "In progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ACTIVE_STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED"];

export function OrdersList() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const ordersQ = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => ordersApi.listMine({ page: 1, pageSize: 100 }),
    staleTime: 30_000,
  });

  const allOrders: Order[] = ordersQ.data?.items ?? [];
  const orderTotal = ordersQ.data?.total ?? allOrders.length;
  const activeCount = allOrders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length;
  const deliveredCount = allOrders.filter((order) => order.status === "DELIVERED").length;
  const awaitingPaymentCount = allOrders.filter((order) => order.status === "PENDING" && order.paymentProvider === "MPESA").length;

  // Client-side filter
  const filtered = allOrders.filter((o) => {
    // Status filter
    if (filter === "active" && !ACTIVE_STATUSES.includes(o.status)) return false;
    if (filter === "delivered" && o.status !== "DELIVERED") return false;
    if (
      filter === "cancelled" &&
      o.status !== "CANCELLED" &&
      o.status !== "REFUNDED"
    )
      return false;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchProduct = o.items.some((it) =>
        it.productName.toLowerCase().includes(q)
      );
      if (!matchNumber && !matchProduct) return false;
    }

    return true;
  });

  // ─── Loading ───
  if (ordersQ.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-ink-500 py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading your orders…
      </div>
    );
  }

  if (ordersQ.isError) {
    return <section className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><Package className="h-6 w-6"/></div><h2 className="mt-4 text-lg font-semibold text-ink-900">We couldn’t load your orders</h2><p className="mt-1 text-sm text-ink-500">Check your connection and try again.</p><button onClick={() => void ordersQ.refetch()} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Try again</button></section>;
  }

  // ─── Empty state (no orders at all) ───
  if (allOrders.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-cream-300 bg-white p-10 md:p-14 text-center">
        <div className="h-16 w-16 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="h-7 w-7 text-ink-400" />
        </div>
        <h2 className="font-display text-2xl text-ink-900 mb-1">
          No orders yet
        </h2>
        <p className="text-sm text-ink-500 max-w-sm mx-auto mb-6">
          When you place your first order, it will show up here so you can
          track it every step of the way.
        </p>
        <Button asChild>
          <Link href="/products">
            Start shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-ink-900">
            My Orders
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            {orderTotal} order{orderTotal !== 1 ? "s" : ""} placed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OrderMetric label="In progress" value={activeCount} icon={<Package className="h-4 w-4"/>} tone="blue"/>
        <OrderMetric label="Delivered" value={deliveredCount} icon={<ShoppingBag className="h-4 w-4"/>} tone="green"/>
        <OrderMetric label="Awaiting payment" value={awaitingPaymentCount} icon={<CreditCard className="h-4 w-4"/>} tone="amber"/>
        <OrderMetric label="All orders" value={orderTotal} icon={<Clock className="h-4 w-4"/>} tone="neutral"/>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or product…"
            className="w-full h-11 rounded-xl border-2 border-ink-200 bg-white pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl border-2 border-ink-200 bg-white overflow-x-auto max-w-full">
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                filter === f
                  ? "bg-ink-900 text-white"
                  : "text-ink-600 hover:bg-cream-100"
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-10 text-center">
          <p className="text-sm text-ink-500">
            No orders match your filters.
          </p>
          <button
            onClick={() => {
              setFilter("all");
              setSearch("");
            }}
            className="mt-3 text-sm text-blue-500 hover:text-blue-600"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderMetric({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: "blue" | "green" | "amber" | "neutral" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", green: "bg-sage-50 text-sage-700", amber: "bg-yellow-50 text-yellow-700", neutral: "bg-cream-100 text-ink-600" };
  return <div className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-white p-3.5 shadow-sm sm:p-4"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><div className="min-w-0"><p className="text-xl font-bold leading-5 tabular-nums text-ink-900">{value}</p><p className="mt-1 truncate text-[11px] text-ink-500">{label}</p></div></div>;
}

// ═══════════════════════════════════════════════════════════
// Order row
// ═══════════════════════════════════════════════════════════

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  const firstImage = order.items[0]?.image;
  const extraItems = order.items.length - 1;

  const canCompletePayment =
    order.status === "PENDING" && (order as any).paymentProvider === "MPESA";

  return (
    <div className="rounded-2xl border border-cream-200 bg-white overflow-hidden hover:border-blue-200 transition-colors">
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-cream-100 bg-cream-50/50">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-mono font-semibold text-ink-800">
            {order.orderNumber}
          </span>
          <span className="text-[11px] text-ink-400">·</span>
          <span className="text-[11px] text-ink-500">
            {formatDateShort((order as any).createdAt)}
          </span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Body */}
      <Link
        href={`/account/orders/${order._id}`}
        className="block px-4 sm:px-5 py-4 hover:bg-cream-50/40 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Thumbnails */}
          <div className="flex -space-x-3 shrink-0">
            {order.items.slice(0, 3).map((it, idx) => (
              <div
                key={idx}
                className="h-14 w-14 rounded-xl bg-cream-100 border-2 border-white overflow-hidden relative shadow-sm"
                style={{ zIndex: 10 - idx }}
              >
                {it.image ? (
                  <Image
                    src={it.image}
                    alt={it.productName}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-cream-400">
                    <Package className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
            {extraItems > 0 && (
              <div className="h-14 w-14 rounded-xl bg-ink-800 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm">
                +{extraItems}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 line-clamp-1">
              {order.items[0]?.productName}
              {order.items.length > 1 && (
                <span className="text-ink-500 font-normal">
                  {" "}
                  and {order.items.length - 1} more
                </span>
              )}
            </p>
            <p className="text-xs text-ink-500 mt-1">
              {itemCount} item{itemCount !== 1 ? "s" : ""} · Delivering to{" "}
              {order.shippingAddress.town}, {order.shippingAddress.county}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-display text-base font-semibold text-ink-900">
                {formatKES(order.total)}
              </span>
              {order.status === "PENDING" && order.paymentProvider === "MPESA" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-yellow-700">
                  <Clock className="h-3 w-3" />
                  Awaiting payment
                </span>
              )}
              {order.status === "PENDING" && order.paymentProvider === "COD" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-700">
                  <Clock className="h-3 w-3" />
                  Pay on delivery
                </span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <ChevronRight className="h-5 w-5 text-ink-300 self-center shrink-0" />
        </div>
      </Link>

      {/* Footer actions — complete payment if MPESA pending */}
      {canCompletePayment && (
        <div className="border-t border-cream-100 bg-yellow-50/40 px-4 sm:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-yellow-800">
            <CreditCard className="h-3.5 w-3.5" />
            <span>
              Payment was not completed. You can finish now.
            </span>
          </div>
          <Link
            href={`/checkout/pay/${order._id}`}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Complete payment
          </Link>
        </div>
      )}
    </div>
  );
}
