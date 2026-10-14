"use client";
import { useState } from "react";
import { adminApi } from "@/lib/api/endpoints";

const money = (amount = 0) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);
export function AnalyticsPanel({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  async function changeRange(value: number) { setDays(value); setLoading(true); try { setData(await adminApi.analytics(value)); } finally { setLoading(false); } }
  const summary = data.summary ?? {};
  const max = Math.max(1, ...(data.dailySales ?? []).map((d: any) => d.revenue));
  return <div className="space-y-6">
    <div className="flex justify-end gap-2">{[7, 30, 90].map((n) => <button key={n} onClick={() => changeRange(n)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${days === n ? "bg-blue-500 text-white" : "border border-cream-300 bg-white text-ink-600"}`}>{n} days</button>)}</div>
    {loading && <p className="text-sm text-ink-500">Updating report…</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Revenue", money(summary.revenue)], ["Orders", summary.orderCount ?? 0], ["Customers", summary.customerCount ?? 0], ["Products", summary.productCount ?? 0]].map(([label, value]) => <div key={label} className="rounded-2xl border border-cream-300 bg-white p-5"><p className="text-sm text-ink-500">{label}</p><p className="mt-2 text-2xl font-bold text-ink-900">{value}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <section className="rounded-2xl border border-cream-300 bg-white p-5"><h2 className="font-semibold text-ink-900">Revenue trend</h2><p className="mb-5 mt-1 text-sm text-ink-500">Completed and in-progress paid orders</p><div className="flex h-52 items-end gap-1 overflow-hidden border-b border-cream-300">{(data.dailySales ?? []).map((point: any) => <div key={point.date} title={`${point.date}: ${money(point.revenue)}`} className="min-w-[3px] flex-1 rounded-t bg-blue-300 hover:bg-blue-500" style={{ height: `${Math.max(2, point.revenue / max * 100)}%` }} />)}</div><div className="mt-3 flex justify-between text-xs text-ink-500"><span>{data.dailySales?.[0]?.date}</span><span>{data.dailySales?.at(-1)?.date}</span></div></section>
      <section className="rounded-2xl border border-cream-300 bg-white p-5"><h2 className="font-semibold text-ink-900">Top products</h2><div className="mt-4 space-y-4">{(data.topProducts ?? []).map((p: any, i: number) => <div key={p._id} className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-pink-50 text-sm font-bold text-pink-600">{i + 1}</span><span className="truncate text-sm font-medium text-ink-800">{p._id}</span></div><span className="shrink-0 text-xs text-ink-500">{p.units} sold</span></div>)}{!data.topProducts?.length && <p className="text-sm text-ink-500">Sales data will appear here as orders are completed.</p>}</div></section>
    </div>
    <section className="rounded-2xl border border-cream-300 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-ink-900">Recent orders</h2><span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">{summary.pendingOrders ?? 0} pending</span></div><div className="overflow-x-auto"><table className="w-full min-w-[550px] text-left text-sm"><thead className="text-xs uppercase text-ink-500"><tr><th className="py-3">Order</th><th>Status</th><th>Date</th><th className="text-right">Total</th></tr></thead><tbody>{(data.recentOrders ?? []).map((o: any) => <tr key={o._id} className="border-t border-cream-200"><td className="py-3 font-semibold text-ink-800">{o.orderNumber}</td><td>{o.status}</td><td>{new Date(o.createdAt).toLocaleDateString()}</td><td className="text-right">{money(o.total)}</td></tr>)}{!data.recentOrders?.length && <tr><td colSpan={4} className="py-6 text-center text-ink-500">No orders yet.</td></tr>}</tbody></table></div></section>
  </div>;
}
