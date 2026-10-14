"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Package,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Copy,
  Check,
  User,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ordersApi } from "@/lib/api/endpoints";
import { cn, formatKES, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "../order-status-badge";
import { StatusUpdater } from "./status-updater";
import type { Order } from "@baby-shop/shared";

interface Props {
  order: Order;
  canManage?: boolean;
}

export function OrderDetail({ order, canManage = false }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  const itemCount = order.items.reduce((s, it) => s + it.quantity, 0);
  const shippingMeta = order.shippingMeta;
  const payment = (order as any).payment;
  const paymentReceived = payment?.status === "SUCCESS" || (order.salesChannel === "POS" && order.status === "DELIVERED") || (order.paymentProvider === "MPESA" && ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status));

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>

        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} size="md" />
          <button
            onClick={() => copy(order.orderNumber, "number")}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-ink-500 hover:text-blue-500 hover:bg-blue-50 transition-colors"
          >
            {copiedId === "number" ? (
              <Check className="h-3.5 w-3.5 text-sage-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy order #
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-cream-200 bg-gradient-to-r from-white via-white to-sage-50/70 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">Order overview</p>
            <h1 className="mt-1 font-display text-2xl text-ink-900">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-ink-600">{order.shippingAddress.fullName} <span className="text-ink-300">·</span> {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${paymentReceived ? "bg-sage-100 text-sage-700" : order.paymentProvider === "COD" ? "bg-blue-50 text-blue-700" : "bg-amber-100 text-amber-800"}`}>
              <CreditCard className="h-3.5 w-3.5" />
              {paymentReceived ? order.salesChannel === "POS" && order.paymentProvider === "COD" ? "Cash received" : "Payment confirmed" : order.paymentProvider === "COD" ? "Due on delivery" : "Awaiting customer payment"}
            </span>
            <span className="rounded-xl bg-ink-900 px-3 py-2 text-sm font-semibold text-white">{formatKES(order.total)}</span>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5">
        {/* ─── Left column ─── */}
        <div className="space-y-5 min-w-0">
          {/* Status updater */}
          {canManage && <StatusUpdater order={order} onError={setError} />}

          {/* Items */}
          <section className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200 bg-cream-50/60">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">
                Items ({itemCount})
              </h2>
            </div>
            <ul className="divide-y divide-cream-200">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 p-4">
                  <div className="h-16 w-16 rounded-xl bg-cream-100 border border-cream-200 overflow-hidden relative shrink-0">
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 line-clamp-2">
                      {item.productName}
                    </p>
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
          <section className="rounded-2xl border-2 border-cream-300 bg-white p-5">
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
              {order.shippingAddress.notes && <p className="mt-2 rounded-lg bg-cream-50 px-3 py-2 text-xs text-ink-600">Delivery instructions: {order.shippingAddress.notes}</p>}
            </div>
          </section>

          {order.notes && (
            <section className="rounded-2xl border-2 border-cream-300 bg-white p-5">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-2">Customer order note</h2>
              <p className="text-sm text-ink-700 leading-6">{order.notes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200 bg-cream-50/60">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider">
                Order summary
              </h2>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-cream-200">
                <span className="text-xs uppercase tracking-wide text-ink-500">Order #</span>
                <button
                  onClick={() => copy(order.orderNumber, "summary-number")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-blue-500"
                >
                  {copiedId === "summary-number" ? <Check className="h-3.5 w-3.5 text-sage-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {order.orderNumber}
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-500">Placed</span>
                  <span className="text-ink-800 font-medium">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-500">Customer</span>
                  <span className="text-ink-800 font-medium text-right max-w-[160px] truncate">
                    {order.shippingAddress.fullName || "Guest customer"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-500">Courier</span>
                  <span className="text-ink-800 font-medium">
                    {shippingMeta?.zoneLabel || order.shippingAddress.county}
                  </span>
                </div>
                {shippingMeta?.etaText && <div className="flex items-center justify-between gap-3"><span className="text-ink-500">Estimated delivery</span><span className="text-right font-medium text-ink-800">{shippingMeta.etaText}</span></div>}
                {shippingMeta?.isFallback && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Fallback rate used. Review delivery coverage for this county.</p>}
              </div>

              <div className="mt-5 pt-4 border-t border-cream-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-cream-100">
                    <tr>
                      <td className="py-2 text-ink-500">Subtotal</td>
                      <td className="py-2 text-right font-medium text-ink-800">
                        {formatKES(order.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-ink-500">Shipping</td>
                      <td className="py-2 text-right font-medium text-ink-800">
                        {formatKES(order.shippingFee)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-ink-500">Tax</td>
                      <td className="py-2 text-right font-medium text-ink-800">
                        {formatKES(order.discount)}
                      </td>
                    </tr>
                    <tr className="font-semibold text-base">
                      <td className="pt-3 text-ink-800">Total</td>
                      <td className="pt-3 text-right text-ink-900">
                        {formatKES(order.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200 bg-cream-50/60">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-ink-400" />
                Payment
              </h2>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Method</span>
                <span className="font-medium text-ink-800">
                  {order.paymentProvider === "MPESA" ? "M-Pesa" : "Cash on delivery"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink-500">Status</span>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold",
                  paymentReceived
                    ? "bg-emerald-100 text-emerald-700"
                    : order.paymentProvider === "COD" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700",
                )}>
                  {paymentReceived ? "Paid" : order.paymentProvider === "COD" ? "Due on delivery" : "Awaiting payment"}
                </span>
              </div>
              <p className="rounded-xl bg-cream-50 px-3 py-2.5 text-xs leading-5 text-ink-500">
                Payment confirmation is managed by the customer payment flow. This order screen controls fulfillment status only.
              </p>
              {(payment as any)?.reference && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink-500">Reference</span>
                  <span className="font-medium text-ink-800 truncate max-w-[160px]">
                    {(payment as any).reference}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border-2 border-cream-300 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200 bg-cream-50/60">
              <h2 className="text-sm font-semibold text-ink-800 uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-ink-400" />
                Customer
              </h2>
            </div>

            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-ink-800 font-medium">
                <User className="h-4 w-4 text-ink-400" />
                {order.shippingAddress.fullName || "Guest customer"}
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <Phone className="h-4 w-4 text-ink-400" />
                {order.shippingAddress.phone}
              </div>
              <div className="flex items-center gap-2 text-ink-600">
                <Calendar className="h-4 w-4 text-ink-400" />
                {formatDate(order.createdAt)}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
