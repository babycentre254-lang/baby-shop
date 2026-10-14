"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock3, CreditCard, PackageCheck, RefreshCw, Search, ShieldCheck } from "lucide-react";
import type { AdminCheckoutSession } from "@/lib/api/endpoints";
import { formatDate, formatKES } from "@/lib/utils";

const LABELS: Record<AdminCheckoutSession["status"], string> = {
  AWAITING_PAYMENT: "Awaiting payment", PAYMENT_PENDING: "Payment in progress", PAYMENT_FAILED: "Payment failed",
  EXPIRED: "Expired", PAID_REVIEW: "Paid · stock review", CANCELLED: "Cancelled",
};

function statusTone(status: AdminCheckoutSession["status"]) {
  if (status === "PAYMENT_PENDING") return "bg-blue-50 text-blue-700";
  if (status === "AWAITING_PAYMENT") return "bg-amber-50 text-amber-800";
  if (status === "PAYMENT_FAILED" || status === "PAID_REVIEW") return "bg-red-50 text-red-700";
  return "bg-ink-100 text-ink-600";
}

export function CheckoutSessionsList({ initialItems, total }: { initialItems: AdminCheckoutSession[]; total: number }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const active = initialItems.filter((item) => ["AWAITING_PAYMENT", "PAYMENT_PENDING", "PAYMENT_FAILED"].includes(item.status)).length;
  const attention = initialItems.filter((item) => item.status === "PAID_REVIEW").length;
  const filtered = useMemo(() => initialItems.filter((item) => `${item.recipient ?? ""} ${item.county ?? ""} ${item.town ?? ""} ${item._id}`.toLowerCase().includes(search.toLowerCase())), [initialItems, search]);
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={<CreditCard className="h-4 w-4" />} label="In progress" value={String(active)} />
      <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Orders created" value="Only after confirmation" />
      <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Needs stock review" value={String(attention)} danger={attention > 0} />
    </div>
    {attention > 0 && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Payment was confirmed, but reserved stock could not be restored after expiry. Contact these customers and resolve each checkout before fulfillment.</div>}
    <section className="overflow-hidden rounded-2xl border border-cream-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 p-4 sm:p-5"><div><h2 className="font-semibold text-ink-900">Recent checkout activity</h2><p className="mt-1 text-xs text-ink-500">{total} session{total === 1 ? "" : "s"} · sessions expire after 30 minutes and release held stock</p></div><button onClick={() => router.refresh()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-cream-300 px-3 text-xs font-semibold text-ink-700 hover:bg-cream-50"><RefreshCw className="h-3.5 w-3.5" />Refresh</button></div>
      <div className="border-b border-cream-200 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, county or reference" className="h-10 w-full rounded-xl border border-cream-300 pl-9 pr-3 text-sm outline-none focus:border-blue-400" /></div></div>
      <div className="divide-y divide-cream-100">
        {filtered.map((item) => <article key={item._id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(item.status)}`}>{LABELS[item.status]}</span><span className="font-mono text-[11px] text-ink-400">{item._id.slice(-10).toUpperCase()}</span>{item.inventoryReserved && <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700"><PackageCheck className="h-3 w-3" />Stock held</span>}</div><p className="mt-2 truncate text-sm font-semibold text-ink-900">{item.recipient || "Customer"} <span className="font-normal text-ink-500">· {[item.town, item.county].filter(Boolean).join(", ") || "Address unavailable"}</span></p><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">{item.phone && <a href={`tel:${item.phone}`} className="font-medium text-blue-600 hover:underline">{item.phone}</a>}<span>{item.paymentProvider === "MPESA" ? "M-Pesa" : "Cash on delivery"}</span><span>Started {formatDate(item.createdAt)}</span>{item.status !== "EXPIRED" && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />Expires {formatDate(item.expiresAt)}</span>}</p></div><p className="text-lg font-semibold text-ink-900">{formatKES(item.total)}</p></article>)}
        {!filtered.length && <div className="px-5 py-14 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-3 font-semibold text-ink-800">{initialItems.length ? "No matching sessions" : "No incomplete checkouts"}</p><p className="mt-1 text-sm text-ink-500">Completed M-Pesa sessions appear in Orders; abandoned attempts stay separate here.</p></div>}
      </div>
    </section>
  </div>;
}

function Metric({ icon, label, value, danger = false }: { icon: React.ReactNode; label: string; value: string; danger?: boolean }) { return <div className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${danger ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>{icon}</span><div><p className="text-xs text-ink-500">{label}</p><p className="mt-0.5 text-sm font-semibold text-ink-900">{value}</p></div></div>; }
