"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleAlert,
  Clock3,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Users,
} from "lucide-react";
import { adminApi, type AdminAnalyticsReport } from "@/lib/api/endpoints";

type Report = AdminAnalyticsReport;

const quickLinks = [
  { href: "/dashboard/products/new", label: "Add product", detail: "Create a new catalog listing", icon: Plus, tone: "bg-blue-50 text-blue-600" },
  { href: "/dashboard/orders", label: "Process orders", detail: "Review and fulfill purchases", icon: ShoppingCart, tone: "bg-pink-50 text-pink-600" },
  { href: "/dashboard/inventory", label: "Check inventory", detail: "Review stock levels", icon: Boxes, tone: "bg-teddy-50 text-teddy-600" },
  { href: "/dashboard/customers", label: "View customers", detail: "Explore your customer list", icon: Users, tone: "bg-cream-100 text-ink-600" },
];

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${value.toLocaleString()}`; }
}

function percentLabel(value: number | null | undefined) {
  if (value == null) return "No previous sales";
  return `${value > 0 ? "+" : ""}${value}% vs previous period`;
}

function revenuePath(points: Report["dailySales"]) {
  const width = 1000, height = 260, padX = 10, padY = 16;
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const coordinates = points.map((point, index) => {
    const x = points.length < 2 ? width / 2 : padX + index * ((width - padX * 2) / (points.length - 1));
    const y = height - padY - (point.revenue / max) * (height - padY * 2);
    return `${x},${y}`;
  });
  const line = coordinates.length ? `M ${coordinates.join(" L ")}` : "";
  const firstX = points.length > 1 ? padX : width / 2;
  const lastX = points.length > 1 ? width - padX : width / 2;
  return { line, area: coordinates.length ? `${line} L ${lastX},${height} L ${firstX},${height} Z` : "", max };
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    PAID: "bg-green-50 text-green-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    SHIPPED: "bg-violet-50 text-violet-700",
    DELIVERED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
    REFUNDED: "bg-cream-100 text-ink-600",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[status] ?? "bg-cream-100 text-ink-600"}`}>{status.toLowerCase().replace(/_/g, " ")}</span>;
}

export function DashboardOverview({ userName, initialReport }: { userName: string; initialReport: Report | null }) {
  const [report, setReport] = useState<Report | null>(initialReport);
  const [days, setDays] = useState(initialReport?.rangeDays ?? 30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh(range = days) {
    setLoading(true); setError("");
    try { const next = await adminApi.analytics(range); setReport(next); setDays(range); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not refresh dashboard data"); }
    finally { setLoading(false); }
  }

  const currency = report?.currency ?? "KES";
  const summary = report?.summary;
  const chart = revenuePath(report?.dailySales ?? []);
  const maxStatus = Math.max(1, ...(report?.orderStatuses ?? []).map((item) => item.count));

  return <div className="space-y-6 pb-8">
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[36px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-24 right-48 h-52 w-52 rounded-full bg-pink-400/20 blur-2xl" />
      <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
        <div><p className="mb-2 text-sm font-medium text-blue-100">{report?.storeName ?? "Your store"} · Overview</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Good day, {userName}<span className="ml-2" aria-hidden="true">✦</span></h1><p className="mt-2 max-w-lg text-sm text-blue-100 sm:text-base">Here’s what’s happening with your store. A quick look at sales, orders, and stock.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          {[7, 30, 90].map((range) => <button key={range} onClick={() => refresh(range)} disabled={loading} className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${days === range ? "border-white bg-white text-blue-700" : "border-white/30 bg-white/10 text-white hover:bg-white/20"}`}>{range} days</button>)}
          <button onClick={() => refresh()} disabled={loading} title="Refresh dashboard" className="grid h-10 w-10 place-items-center rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
      </div>
    </section>

    {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button onClick={() => refresh()} className="shrink-0 font-semibold underline">Retry</button></div>}
    {!report && !error && <div className="rounded-2xl border border-cream-300 bg-white p-8 text-center text-sm text-ink-500">Loading store data…</div>}
    {!report && error && <div className="rounded-2xl border border-dashed border-cream-400 bg-white p-8 text-center"><p className="font-semibold text-ink-800">Dashboard data is unavailable</p><p className="mt-1 text-sm text-ink-500">Check the API connection and try again.</p></div>}

    {report && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sales revenue" value={money(summary?.revenue ?? 0, currency)} detail={percentLabel(summary?.revenueChangePercent)} icon={ShoppingBag} tone="blue" trend={summary?.revenueChangePercent} />
        <MetricCard label="Orders this period" value={(summary?.orderCount ?? 0).toLocaleString()} detail={percentLabel(summary?.orderChangePercent)} icon={ShoppingCart} tone="pink" trend={summary?.orderChangePercent} />
        <MetricCard label="Customers" value={(summary?.customerCount ?? 0).toLocaleString()} detail="Registered accounts" icon={Users} tone="teddy" />
        <MetricCard label="Low stock variants" value={(summary?.lowStockVariants ?? 0).toLocaleString()} detail="At or below their stock threshold" icon={CircleAlert} tone="amber" alert={(summary?.lowStockVariants ?? 0) > 0} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(310px,0.8fr)]">
        <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-ink-900">Revenue overview</h2><p className="mt-1 text-sm text-ink-500">Daily captured revenue · {days} days</p></div><div className="rounded-xl bg-blue-50 px-3 py-2 text-right"><p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">This period</p><p className="mt-0.5 text-lg font-bold text-blue-800">{money(summary?.revenue ?? 0, currency)}</p></div></div>
          <div className="mt-5 h-56 w-full"><svg viewBox="0 0 1000 260" preserveAspectRatio="none" role="img" aria-label={`Revenue over the last ${days} days`} className="h-full w-full overflow-visible"><defs><linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0090D8" stopOpacity=".22"/><stop offset="100%" stopColor="#0090D8" stopOpacity="0"/></linearGradient></defs><path d="M 0,244 H 1000" stroke="#eee8df" strokeDasharray="4 8"/><path d={chart.area} fill="url(#sales-fill)"/><path d={chart.line} fill="none" stroke="#0090D8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>{(report.dailySales ?? []).map((point, index) => { const x = report.dailySales.length < 2 ? 500 : 10 + index * (980 / (report.dailySales.length - 1)); const y = 244 - (point.revenue / chart.max) * 228; return <circle key={point.date} cx={x} cy={y} r={report.dailySales.length > 45 ? 2 : 4} fill="#fff" stroke="#0090D8" strokeWidth="2"><title>{`${point.date}: ${money(point.revenue, currency)} · ${point.orders} orders`}</title></circle>; })}</svg></div>
          <div className="mt-3 flex justify-between text-xs text-ink-400"><span>{report.dailySales?.[0]?.date ?? "—"}</span><span>{report.dailySales?.at(-1)?.date ?? "—"}</span></div>
        </section>
        <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold text-ink-900">Order status</h2><p className="mt-1 text-sm text-ink-500">Orders in the selected period</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-pink-50 text-pink-600"><Clock3 className="h-5 w-5"/></span></div><div className="mt-5 space-y-4">{(report.orderStatuses ?? []).map(({ status, count }) => <div key={status}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium capitalize text-ink-700">{status.toLowerCase()}</span><span className="text-ink-500">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-cream-100"><div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.max(4, count / maxStatus * 100)}%` }}/></div></div>)}{!report.orderStatuses.length && <p className="rounded-xl bg-cream-50 p-4 text-sm text-ink-500">No orders in this period yet.</p>}</div><Link href="/dashboard/orders" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">View all orders <ArrowRight className="h-4 w-4"/></Link></section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <section className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-cream-200 px-5 py-4"><div><h2 className="font-bold text-ink-900">Recent orders</h2><p className="mt-0.5 text-xs text-ink-500">Latest activity from your store</p></div><Link href="/dashboard/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-700">See all</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-cream-50 text-[11px] uppercase tracking-wide text-ink-500"><tr><th className="px-5 py-3">Order</th><th>Payment</th><th>Status</th><th>Date</th><th className="pr-5 text-right">Total</th></tr></thead><tbody>{report.recentOrders.map((order) => <tr key={order._id} className="border-t border-cream-100"><td className="px-5 py-3.5 font-semibold text-ink-900">{order.orderNumber}</td><td className="text-xs text-ink-500">{order.paymentProvider ?? "—"}</td><td><StatusPill status={order.status}/></td><td className="text-xs text-ink-500">{new Date(order.createdAt).toLocaleDateString()}</td><td className="pr-5 text-right font-semibold text-ink-800">{money(order.total, currency)}</td></tr>)}{!report.recentOrders.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-500">No orders to show yet.</td></tr>}</tbody></table></div><div className="border-t border-cream-100 px-5 py-3 text-xs text-ink-500">{summary?.pendingOrders ?? 0} orders are waiting for payment or processing.</div></section>
        <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Stock watch</h2><p className="mt-0.5 text-xs text-ink-500">Products with low variant inventory</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Package className="h-5 w-5"/></span></div><div className="mt-3 divide-y divide-cream-100">{report.lowStockProducts.map((product) => <Link key={product._id} href={`/dashboard/products/${product._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-cream-50"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink-800">{product.name}</span><span className="mt-0.5 block text-xs text-ink-500">{product.lowStockVariants} variant{product.lowStockVariants === 1 ? "" : "s"} low</span></span><span className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold ${product.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{product.stock} left</span></Link>)}{!report.lowStockProducts.length && <div className="py-8 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-green-50 text-green-600">✓</span><p className="mt-2 text-sm font-semibold text-ink-800">Stock levels look good</p><p className="mt-1 text-xs text-ink-500">No variants are below their alert threshold.</p></div>}</div><Link href="/dashboard/inventory" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">Open inventory <ArrowRight className="h-4 w-4"/></Link></section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)]">
        <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Best sellers</h2><p className="mt-0.5 text-xs text-ink-500">By units sold during this period</p></div><ShoppingBag className="h-5 w-5 text-pink-500"/></div><div className="space-y-3">{report.topProducts.map((product, index) => <div key={product._id} className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pink-50 text-xs font-bold text-pink-700">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-800">{product._id}</span><span className="text-xs text-ink-500">{product.units} sold</span><span className="w-24 text-right text-xs font-semibold text-ink-700">{money(product.revenue, currency)}</span></div>)}{!report.topProducts.length && <p className="rounded-xl bg-cream-50 p-4 text-sm text-ink-500">Your best sellers will appear here after an order is paid.</p>}</div></section>
        <section className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-ink-900">Quick actions</h2><p className="mt-0.5 text-xs text-ink-500">Jump back into store operations</p></div><ArrowRight className="h-5 w-5 text-ink-300"/></div><div className="grid gap-2 sm:grid-cols-2">{quickLinks.map(({ href, label, detail, icon: Icon, tone }) => <Link key={href} href={href} className="group rounded-xl border border-cream-200 p-3 transition hover:border-blue-200 hover:bg-blue-50/50"><span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}><Icon className="h-4 w-4"/></span><span className="mt-2 block text-sm font-semibold text-ink-800 group-hover:text-blue-700">{label}</span><span className="mt-0.5 block text-xs text-ink-500">{detail}</span></Link>)}</div></section>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-ink-400"><span>Product catalog: {(summary?.productCount ?? 0).toLocaleString()} items</span><span>Data refreshes when you open the dashboard or use refresh.</span></div>
    </>}
  </div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone, trend, alert }: { label: string; value: string; detail: string; icon: typeof Package; tone: "blue" | "pink" | "teddy" | "amber"; trend?: number | null; alert?: boolean }) {
  const colors = { blue: "bg-blue-50 text-blue-600", pink: "bg-pink-50 text-pink-600", teddy: "bg-teddy-50 text-teddy-600", amber: "bg-amber-50 text-amber-600" };
  return <article className="rounded-2xl border border-cream-300 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-ink-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-ink-900">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[tone]}`}><Icon className="h-5 w-5"/></span></div><p className={`mt-3 flex items-center gap-1 text-xs ${alert ? "font-semibold text-amber-700" : "text-ink-500"}`}>{trend != null && (trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5 text-green-600"/> : trend < 0 ? <ArrowDownRight className="h-3.5 w-3.5 text-red-500"/> : null)}{detail}</p></article>;
}
