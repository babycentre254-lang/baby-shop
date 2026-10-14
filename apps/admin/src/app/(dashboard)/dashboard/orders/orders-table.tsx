"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Eye,
  X,
  Filter,
  Package,
  AlertTriangle,
  Loader2,
  ChevronDown,
  CheckSquare,
  Square,
  DollarSign,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { ordersApi } from "@/lib/api/endpoints";
import { cn, formatKES, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order, OrderStatus } from "@baby-shop/shared";

interface Props {
  initialOrders: Order[];
  canManage: boolean;
}

type StatusFilter = "all" | OrderStatus | "active";

const ACTIVE_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
];

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "PENDING", label: "Pending" },
  { id: "PAID", label: "Paid" },
  { id: "PROCESSING", label: "Processing" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "REFUNDED", label: "Refunded" },
];

const BULK_ACTIONS: {
  status: OrderStatus;
  label: string;
  icon: typeof CheckCircle2;
  tone: "default" | "sage" | "blue";
}[] = [
  { status: "PROCESSING", label: "Mark Processing", icon: Package, tone: "default" },
  { status: "SHIPPED", label: "Mark Shipped", icon: Truck, tone: "sage" },
  { status: "DELIVERED", label: "Mark Delivered", icon: CheckCircle2, tone: "sage" },
];

export function OrdersTable({ initialOrders, canManage }: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Bulk update mutation ───
  const bulkMutation = useMutation({
    mutationFn: async (input: { ids: string[]; status: OrderStatus }) => {
      const results = await Promise.allSettled(
        input.ids.map((id) =>
          ordersApi.updateStatus(id, {
            status: input.status,
            note: "Bulk status update from admin",
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { updated: input.ids.length - failed, failed };
    },
    onSuccess: ({ updated, failed }) => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelected(new Set());
      setBulkOpen(false);
      if (failed > 0) {
        setError(`${failed} order${failed > 1 ? "s" : ""} could not be updated (invalid transition).`);
      }
      router.refresh();
    },
    onError: (err: any) => {
      setError(err?.message ?? "Bulk update failed");
      setBulkOpen(false);
    },
  });

  // ─── Filter ───
  const filtered = useMemo(() => {
    let list = [...initialOrders];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.shippingAddress.fullName.toLowerCase().includes(q) ||
          o.shippingAddress.phone.includes(q) ||
          o.shippingAddress.county.toLowerCase().includes(q) ||
          o.shippingAddress.town.toLowerCase().includes(q) ||
          (o.shippingMeta?.zoneLabel ?? "").toLowerCase().includes(q) ||
          o.items.some((it) =>
            it.productName.toLowerCase().includes(q)
          )
      );
    }

    if (statusFilter === "active") {
      list = list.filter((o) => ACTIVE_STATUSES.includes(o.status));
    } else if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }

    return list;
  }, [initialOrders, search, statusFilter]);

  // ─── Stats ───
  const stats = useMemo(() => {
    const all = initialOrders;
    return {
      total: all.length,
      pending: all.filter((o) => o.status === "PENDING").length,
      active: all.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      revenue: all
        .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
        .reduce((sum, o) => sum + o.total, 0),
    };
  }, [initialOrders]);

  // ─── Selection helpers ───
  const allSelected =
    filtered.length > 0 &&
    filtered.every((o) => selected.has(o._id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o._id)));
    }
  }

  function applyBulk(status: OrderStatus) {
    bulkMutation.mutate({ ids: [...selected], status });
  }

  const hasFilters = search || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <>
      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Total orders"
          value={String(stats.total)}
          tone="default"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending"
          value={String(stats.pending)}
          tone={stats.pending > 0 ? "yellow" : "sage"}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Active"
          value={String(stats.active)}
          tone="blue"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Revenue"
          value={formatKES(stats.revenue)}
          tone="sage"
        />
      </div>

      {/* ─── Toolbar ─── */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, phone, product…"
              className="w-full h-10 rounded-xl border-2 border-ink-200 bg-white pl-10 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm text-ink-500 hover:text-ink-800 hover:bg-cream-100 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl border-2 border-ink-200 bg-white overflow-x-auto">
          {FILTERS.map((f) => {
            const count =
              f.id === "all"
                ? initialOrders.length
                : f.id === "active"
                ? stats.active
                : initialOrders.filter((o) => o.status === f.id).length;

            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  statusFilter === f.id
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-cream-100"
                )}
              >
                {f.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold",
                      statusFilter === f.id
                        ? "bg-white/20 text-white"
                        : "bg-cream-200 text-ink-600"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-ink-500">
          Showing <strong>{filtered.length}</strong> of{" "}
          <strong>{initialOrders.length}</strong> orders
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="mb-4 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── Bulk action bar ─── */}
      {canManage && selected.size > 0 && (
        <div className="mb-4 sticky top-20 z-30 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <span className="font-semibold">{selected.size}</span>
            <span>selected</span>
          </div>

          <div className="flex-1" />

          <div className="relative">
            <button
              onClick={() => setBulkOpen((v) => !v)}
              disabled={bulkMutation.isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {bulkMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Update status
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  bulkOpen && "rotate-180"
                )}
              />
            </button>

            {bulkOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border-2 border-cream-300 bg-white shadow-xl overflow-hidden z-50">
                {BULK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.status}
                      onClick={() => applyBulk(action.status)}
                      disabled={bulkMutation.isPending}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors",
                        "hover:bg-blue-50 disabled:opacity-50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          action.tone === "sage"
                            ? "text-sage-600"
                            : action.tone === "blue"
                            ? "text-blue-600"
                            : "text-ink-500"
                        )}
                      />
                      <span className="text-ink-800">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {canManage && <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-blue-700 hover:text-blue-900 font-medium"
          >
            Clear
          </button>}
        </div>
      )}

      {/* ─── Table ─── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-white p-12 text-center">
          <div className="h-14 w-14 rounded-full bg-cream-100 flex items-center justify-center mx-auto mb-4">
            <Filter className="h-7 w-7 text-ink-400" />
          </div>
          <h3 className="font-semibold text-ink-900">
            {initialOrders.length === 0 ? "No orders yet" : "No matches"}
          </h3>
          <p className="text-sm text-ink-500 mt-1">
            {initialOrders.length === 0
              ? "Orders will appear here when customers start buying."
              : "Try clearing your filters."}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-blue-500 hover:text-blue-600"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr className="text-left text-xs uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3 w-10">
                    {canManage && <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-ink-500 hover:text-blue-500"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>}
                  </th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    selected={selected.has(order._id)}
                    onToggle={() => toggleSelect(order._id)}
                    canManage={canManage}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Order row
// ═══════════════════════════════════════════════════════════

function OrderRow({
  order,
  selected,
  onToggle,
  canManage,
}: {
  order: Order;
  selected: boolean;
  onToggle: () => void;
  canManage: boolean;
}) {
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  const firstItem = order.items[0];

  return (
    <tr
      className={cn(
        "border-b border-cream-200 last:border-0 transition-colors hover:bg-cream-50/60",
        selected && "bg-blue-50/40"
      )}
    >
      <td className="px-4 py-3">
        {canManage && <>
        <button
          type="button"
          onClick={onToggle}
          className="text-ink-500 hover:text-blue-500"
          aria-label="Select order"
        >
          {selected ? (
            <CheckSquare className="h-4 w-4 text-blue-500" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
        </>}
      </td>

      <td className="px-4 py-3">
        <Link
          href={`/dashboard/orders/${order._id}`}
          className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {order.orderNumber}
        </Link>
        {order.salesChannel === "POS" && <span className="ml-2 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">In-store</span>}
      </td>

      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate max-w-[180px]">
            {order.shippingAddress.fullName}
          </p>
          <p className="text-[11px] text-ink-500 truncate max-w-[180px]">
            {order.shippingAddress.phone}
          </p>
          <p className="text-[11px] text-ink-400 truncate max-w-[180px]">
            {order.shippingAddress.town}, {order.shippingAddress.county}
          </p>
          {order.shippingMeta?.isFallback && <p className="mt-1 text-[10px] font-semibold text-amber-700">Fallback shipping rate</p>}
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-900 truncate max-w-[200px]">
            {firstItem?.productName}
          </p>
          <p className="text-[11px] text-ink-500">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
            {order.items.length > 1 &&
              ` · ${order.items.length} products`}
          </p>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-ink-900">
          {formatKES(order.total)}
        </span>
      </td>

      <td className="px-4 py-3">
        <OrderStatusBadge status={order.status} />
      </td>

      <td className="px-4 py-3">
        <span className="text-xs text-ink-500">
          {formatDate((order as any).createdAt)}
        </span>
      </td>

      <td className="px-4 py-3 text-right">
        <Link
          href={`/dashboard/orders/${order._id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          aria-label="View order"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

// ═══════════════════════════════════════════════════════════
// Stat card
// ═══════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "default" | "blue" | "sage" | "yellow";
}) {
  const toneClasses = {
    default: "bg-cream-100 text-ink-600",
    blue: "bg-blue-50 text-blue-600",
    sage: "bg-sage-100 text-sage-700",
    yellow: "bg-yellow-100 text-yellow-700",
  }[tone];

  return (
    <div className="rounded-xl border-2 border-cream-300 bg-white p-3">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", toneClasses)}>
        {icon}
      </div>
      <p className="text-[10px] text-ink-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-ink-900 mt-0.5">{value}</p>
    </div>
  );
}
