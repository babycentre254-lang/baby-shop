"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/endpoints";
import { formatKES, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderTimeline } from "./order-timeline";
import type { Order } from "@baby-shop/shared";

interface Props {
  order: Order;
}

const CANCELLABLE_STATUSES = ["PENDING", "PAID", "PROCESSING"];

export function OrderDetail({ order }: Props) {
  const router = useRouter();
  const qc = useQueryClient();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => ordersApi.cancel(order._id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      router.refresh();
      setConfirmCancel(false);
    },
    onError: (err: any) => {
      setError(err?.message ?? "Could not cancel the order");
      setConfirmCancel(false);
    },
  });

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const needsPayment =
    order.status === "PENDING" && (order as any).paymentProvider === "MPESA";
  const payment = (order as any).payment;
  const shippingMeta = (order as any).shippingMeta;
  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="rounded-3xl border border-cream-200 bg-gradient-to-br from-white via-white to-sage-50/70 p-5 shadow-sm sm:p-6">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl text-ink-900">
                Order{" "}
                <span className="font-mono font-semibold">
                  {order.orderNumber}
                </span>
              </h1>
              <OrderStatusBadge status={order.status} size="md" />
            </div>
            <p className="text-xs text-ink-500 mt-1.5 flex items-center gap-2 flex-wrap">
              <Calendar className="h-3 w-3" />
              Placed {formatDate((order as any).createdAt)}
              <button
                onClick={() => copy(order.orderNumber, "number")}
                className="inline-flex items-center gap-1 text-ink-400 hover:text-blue-500 transition-colors"
                title="Copy order number"
              >
                {copiedId === "number" ? (
                  <Check className="h-3 w-3 text-sage-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {needsPayment && (
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href={`/checkout/pay/${order._id}`}>
                  <CreditCard className="h-4 w-4" />
                  Complete payment
                </Link>
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                onClick={() => setConfirmCancel(true)}
                className="text-pink-600 border-pink-200 hover:bg-pink-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel order
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 flex items-start gap-2 text-sm text-pink-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {needsPayment && (
          <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 shrink-0 text-yellow-700" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                This order is awaiting payment
              </p>
              <p className="text-xs text-yellow-800 mt-0.5">
                Complete the M-Pesa payment to have your order processed and
                shipped.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Grid ─── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* ─── Left: main ─── */}
        <div className="space-y-5 min-w-0">
          {/* Tracking */}
          <section className="rounded-2xl border border-cream-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4 text-ink-400" />
              Order tracking
            </h2>
            <OrderTimeline
              currentStatus={order.status}
              history={(order as any).statusHistory ?? []}
              paymentProvider={(order as any).paymentProvider}
            />
          </section>

          {/* Items */}
          <section className="rounded-2xl border border-cream-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-100">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">
                Items ({itemCount})
              </h2>
            </div>

            <ul className="divide-y divide-cream-100">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 p-4">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="h-16 w-16 rounded-xl bg-cream-100 border border-cream-200 overflow-hidden relative shrink-0"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-cream-400">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="text-sm font-medium text-ink-900 hover:text-blue-600 line-clamp-2"
                    >
                      {item.productName}
                    </Link>
                    {(item.size || item.color) && (
                      <p className="text-[11px] text-ink-500 mt-0.5">
                        {[item.size, item.color].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="text-[11px] font-mono text-ink-400 mt-1">
                      {item.sku}
                    </p>
                    <p className="text-xs text-ink-500 mt-1.5">
                      {formatKES(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-ink-900">
                      {formatKES(item.lineTotal)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Delivery address */}
          <section className="rounded-2xl border border-cream-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-ink-400" />
              Delivery address
            </h2>
            <div className="space-y-1">
              <p className="text-sm font-medium text-ink-900">
                {order.shippingAddress.fullName}
              </p>
              <p className="text-xs text-ink-500 flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                {order.shippingAddress.phone}
              </p>
              <p className="text-sm text-ink-700 mt-2">
                {order.shippingAddress.street}
              </p>
              <p className="text-sm text-ink-700">
                {order.shippingAddress.town}, {order.shippingAddress.county}
              </p>
              {order.shippingAddress.notes && (
                <p className="text-xs text-ink-500 italic mt-2">
                  {order.shippingAddress.notes}
                </p>
              )}
            </div>
          </section>

          {/* Notes */}
          {order.notes && (
            <section className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-2">
                Order notes
              </h2>
              <p className="text-sm text-ink-600 whitespace-pre-line">
                {order.notes}
              </p>
            </section>
          )}
        </div>

        {/* ─── Right: summary ─── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-cream-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-4">
              Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              <Row label="Subtotal" value={formatKES(order.subtotal)} />
              {order.discount > 0 && (
                <Row
                  label="Discount"
                  value={
                    <span className="text-sage-600">
                      −{formatKES(order.discount)}
                    </span>
                  }
                />
              )}
              <Row
                label="Shipping"
                value={
                  order.shippingFee === 0 ? (
                    <span className="text-sage-600 font-semibold">Free</span>
                  ) : (
                    formatKES(order.shippingFee)
                  )
                }
                sublabel={shippingMeta?.zoneLabel}
              />
              <div className="border-t border-cream-200 pt-3 mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-ink-900">Total</span>
                  <span className="font-display text-xl font-semibold text-ink-900">
                    {formatKES(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-cream-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-3">
              Payment
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Method</span>
                <span className="font-medium text-ink-900">
                  {(order as any).paymentProvider === "MPESA"
                    ? "M-Pesa"
                    : "Cash on Delivery"}
                </span>
              </div>
              {payment?.mpesaReceiptNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">Receipt</span>
                  <button
                    onClick={() => copy(payment.mpesaReceiptNumber, "receipt")}
                    className="inline-flex items-center gap-1 font-mono text-xs font-medium text-ink-800 hover:text-blue-600 transition-colors"
                  >
                    {payment.mpesaReceiptNumber}
                    {copiedId === "receipt" ? (
                      <Check className="h-3 w-3 text-sage-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500">Payment status</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  payment?.status === "SUCCESS" || (order.paymentProvider === "MPESA" && ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status))
                    ? "bg-sage-100 text-sage-700"
                    : order.paymentProvider === "COD"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {payment?.status === "SUCCESS" || (order.paymentProvider === "MPESA" && ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status))
                    ? "Paid"
                    : order.paymentProvider === "COD"
                    ? "Due on delivery"
                    : "Awaiting payment"}
                </span>
              </div>
              {order.paymentProvider === "COD" && (
                <p className="rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800">
                  Please pay the courier when your order arrives. Your order can be prepared while payment is collected on delivery.
                </p>
              )}
            </div>
          </div>

          {/* Delivery info */}
          {shippingMeta && (
            <div className="rounded-2xl border border-cream-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-3">
                Delivery
              </h2>
              <div className="space-y-2 text-sm">
                <Row label="Zone" value={shippingMeta.zoneLabel ?? "—"} />
                {shippingMeta.etaText && (
                  <Row label="Est. time" value={shippingMeta.etaText} />
                )}
                <Row
                  label="Weight"
                  value={`${(shippingMeta.totalWeightGrams / 1000).toFixed(
                    2
                  )} kg`}
                />
              </div>
            </div>
          )}

          {/* Help */}
          <div className="rounded-2xl border border-cream-200 bg-cream-50/50 p-4 text-xs text-ink-600">
            <p className="font-medium text-ink-800 mb-1">
              Need help with this order?
            </p>
            <p>
              Email{" "}
              <span className="font-semibold">support@babycentre.co.ke</span>{" "}
              or call <span className="font-semibold">+254 700 000 000</span>.
              Reference your order number.
            </p>
          </div>
        </aside>
      </div>

      {/* ─── Cancel dialog ─── */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="font-semibold text-ink-900">Cancel this order?</h3>
            </div>
            <p className="text-sm text-ink-600 mb-4">
              This order will be cancelled. If you've already paid, a refund
              will be issued within 3–5 business days.
            </p>

            <label className="block text-xs font-medium text-ink-600 mb-1.5">
              Reason (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us why — helps us improve"
              rows={3}
              maxLength={300}
              className="w-full rounded-xl border-2 border-ink-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none"
            />

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setConfirmCancel(false);
                  setCancelReason("");
                }}
                className="h-10 px-4 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:bg-cream-100 transition-colors"
              >
                Keep order
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelReason)}
                disabled={cancelMutation.isPending}
                className="h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2"
              >
                {cancelMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-ink-500">{label}</span>
        <span className="font-medium text-ink-900">{value}</span>
      </div>
      {sublabel && (
        <p className="text-[10px] text-ink-400 text-right mt-0.5">
          {sublabel}
        </p>
      )}
    </div>
  );
}
