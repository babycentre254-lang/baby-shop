"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  RotateCcw,
  Loader2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { ordersApi } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@baby-shop/shared";

interface Props {
  order: Order;
  onError: (msg: string | null) => void;
}

// Status machine — matches the backend validation exactly
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const STATUS_META: Record<
  OrderStatus,
  { label: string; icon: typeof Clock; tone: string }
> = {
  PENDING: { label: "Pending", icon: Clock, tone: "text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
  PAID: { label: "Paid", icon: CheckCircle2, tone: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
  PROCESSING: { label: "Processing", icon: Package, tone: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100" },
  SHIPPED: { label: "Shipped", icon: Truck, tone: "text-sage-600 bg-sage-50 border-sage-200 hover:bg-sage-100" },
  DELIVERED: { label: "Delivered", icon: Home, tone: "text-sage-600 bg-sage-50 border-sage-200 hover:bg-sage-100" },
  CANCELLED: { label: "Cancelled", icon: XCircle, tone: "text-ink-600 bg-ink-50 border-ink-200 hover:bg-ink-100" },
  REFUNDED: { label: "Refunded", icon: RotateCcw, tone: "text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100" },
};

export function StatusUpdater({ order, onError }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<OrderStatus | null>(null);

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) =>
      ordersApi.updateStatus(order._id, {
        status,
        note: note.trim() || undefined,
      }),
    onMutate: (status) => {
      setPending(status);
      onError(null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order", order._id] });
      setNote("");
      setPending(null);
      router.refresh();
    },
    onError: (err: any) => {
      onError(err?.message ?? "Failed to update status");
      setPending(null);
    },
  });

  const allowed = (TRANSITIONS[order.status] ?? []).filter(
    (status) => status !== "PROCESSING" || order.paymentProvider === "COD"
  );
  const isTerminal = allowed.length === 0;

  return (
    <section className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-cream-200 bg-cream-50/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">
          Update status
        </h2>
        <span className="text-[11px] text-ink-500">
          Current: <strong className="text-ink-700">{STATUS_META[order.status].label}</strong>
        </span>
      </div>

      <div className="p-5 space-y-4">
        {isTerminal ? (
          <div className="flex items-start gap-2.5 rounded-xl border-2 border-ink-200 bg-ink-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-ink-500 mt-0.5 shrink-0" />
            <p className="text-sm text-ink-600">
              This order is <strong>{STATUS_META[order.status].label}</strong> — a terminal state. No further transitions are allowed.
            </p>
          </div>
        ) : (
          <>
            {/* Optional note */}
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5">
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Packed and ready for dispatch"
                disabled={mutation.isPending}
                className="w-full h-10 rounded-xl border-2 border-ink-200 bg-white px-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
            </div>

            {/* Transition buttons */}
            <div>
              <p className="text-xs font-medium text-ink-600 mb-2">
                Move to:
              </p>
              <div className="flex flex-wrap gap-2">
                {allowed.map((next) => {
                  const meta = STATUS_META[next];
                  const Icon = meta.icon;
                  const isThisPending = pending === next && mutation.isPending;
                  return (
                    <button
                      key={next}
                      onClick={() => mutation.mutate(next)}
                      disabled={mutation.isPending}
                      className={cn(
                        "inline-flex items-center gap-2 h-10 px-4 rounded-xl border-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        meta.tone
                      )}
                    >
                      {isThisPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      {meta.label}
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
