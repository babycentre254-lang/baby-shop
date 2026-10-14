"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Mail, Search, ShoppingBag, X } from "lucide-react";
import { adminApi, type AdminUser, type CustomerDetails, type CustomerStats } from "@/lib/api/endpoints";

const currency = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 });
const date = (value?: string | null) => value ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "—";

export function CustomersTable({ initialCustomers, initialTotal, initialPage, initialPageSize, initialStats }: {
  initialCustomers: AdminUser[]; initialTotal: number; initialPage: number; initialPageSize: number; initialStats: CustomerStats;
}) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [stats, setStats] = useState(initialStats);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [verified, setVerified] = useState<"all" | "true" | "false">("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState("");
  const totalPages = Math.ceil(total / pageSize);

  const load = useCallback(async (nextPage: number, searchTerm: string, verifiedFilter: "all" | "true" | "false") => {
    setBusy(true);
    setError("");
    try {
      const result = await adminApi.customers({ page: nextPage, pageSize, search: searchTerm || undefined, verified: verifiedFilter === "all" ? undefined : verifiedFilter === "true" });
      setCustomers(result.items);
      setTotal(result.total);
      setPage(result.page);
      if (result.stats) setStats(result.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load customers. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput.trim() !== search) {
        const next = searchInput.trim();
        setSearch(next);
        setPage(1);
        void load(1, next, verified);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, verified, load]);

  useEffect(() => {
    if (verified !== "all" || search) void load(1, search, verified);
  // Initial results are already server rendered; subsequent filter changes load here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  async function openCustomer(customer: AdminUser) {
    setSelected(customer);
    setDetails(null);
    setDetailError("");
    setDetailBusy(true);
    try { setDetails(await adminApi.customer(customer._id)); }
    catch (err) { setDetailError(err instanceof Error ? err.message : "Could not load customer details."); }
    finally { setDetailBusy(false); }
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-cream-200 p-4 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-semibold text-ink-900">Customer directory</h2><p className="mt-1 text-xs text-ink-500">Search profiles, check verification, and review purchase activity.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"/><input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Search name, email or phone" className="h-10 w-full rounded-xl border border-cream-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" aria-label="Search customers"/></label>
            <select value={verified} onChange={event => { setVerified(event.target.value as typeof verified); setPage(1); }} className="h-10 rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-700 outline-none focus:border-blue-400" aria-label="Filter by email verification"><option value="all">All verification</option><option value="true">Verified</option><option value="false">Unverified</option></select>
          </div>
        </div>
        {error && <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button onClick={() => void load(page, search, verified)} className="font-semibold underline">Retry</button></div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-cream-50 text-[11px] font-semibold uppercase tracking-wide text-ink-500"><tr><th className="px-5 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Email status</th><th className="px-5 py-3 text-right">Profile</th></tr></thead>
            <tbody className={busy ? "opacity-50" : ""}>
              {customers.map(customer => <tr key={customer._id} className="border-t border-cream-200 transition hover:bg-cream-50/70">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">{(customer.firstName?.[0] ?? "C")}{customer.lastName?.[0] ?? ""}</span><div><p className="font-semibold text-ink-900">{customer.firstName} {customer.lastName}</p><p className="mt-0.5 text-xs text-ink-400">Customer account</p></div></div></td>
                <td className="px-4 py-4"><p className="text-ink-700">{customer.email}</p><p className="mt-1 text-xs text-ink-400">{customer.phone || "No phone added"}</p></td>
                <td className="px-4 py-4 text-ink-600">{date(customer.createdAt)}</td>
                <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${customer.isEmailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{customer.isEmailVerified && <BadgeCheck size={13}/ >}{customer.isEmailVerified ? "Verified" : "Unverified"}</span></td>
                <td className="px-5 py-4 text-right"><button onClick={() => void openCustomer(customer)} className="rounded-lg border border-cream-300 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">View details</button></td>
              </tr>)}
              {!busy && !customers.length && <tr><td colSpan={5} className="px-5 py-16 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-100 text-ink-400"><Search size={20}/></div><p className="mt-3 font-semibold text-ink-800">No customers found</p><p className="mt-1 text-sm text-ink-500">Try a different name, email, or verification filter.</p></td></tr>}
              {busy && !customers.length && <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-ink-500"><LoaderCircle className="mr-2 inline animate-spin" size={16}/>Loading customers…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-cream-200 px-4 py-3 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between"><span>Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()} customers <span className="text-ink-300">·</span> {stats.newLast30Days.toLocaleString()} joined in 30 days</span><div className="flex items-center gap-2"><button disabled={page <= 1 || busy} onClick={() => void load(page - 1, search, verified)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-cream-300 px-2.5 disabled:opacity-40"><ChevronLeft size={15}/>Previous</button><span className="px-1">Page {page}{totalPages ? ` of ${totalPages}` : ""}</span><button disabled={page >= totalPages || busy} onClick={() => void load(page + 1, search, verified)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-cream-300 px-2.5 disabled:opacity-40">Next<ChevronRight size={15}/></button></div></div>
      </section>

      {selected && <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/35" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
        <aside role="dialog" aria-modal="true" aria-label={`${selected.firstName} ${selected.lastName} customer details`} className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-200 bg-white px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Customer profile</p><h2 className="mt-1 text-lg font-bold text-ink-900">{selected.firstName} {selected.lastName}</h2></div><button onClick={() => setSelected(null)} aria-label="Close customer details" className="grid h-9 w-9 place-items-center rounded-xl border border-cream-300 text-ink-500 hover:bg-cream-50"><X size={18}/></button></div>
          {detailBusy ? <div className="grid flex-1 place-items-center text-sm text-ink-500"><span><LoaderCircle className="mr-2 inline animate-spin" size={17}/>Loading customer activity…</span></div> : detailError ? <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{detailError}</p> : details && <div className="space-y-5 p-5">
            <section className="rounded-2xl border border-cream-300 p-4"><div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700">{details.customer.firstName[0]}{details.customer.lastName[0]}</span><div className="min-w-0 flex-1"><h3 className="font-semibold text-ink-900">{details.customer.firstName} {details.customer.lastName}</h3><p className="mt-1 break-all text-sm text-ink-500">{details.customer.email}</p><p className="mt-1 text-sm text-ink-500">{details.customer.phone || "No phone number"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${details.customer.isEmailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{details.customer.isEmailVerified ? "Verified" : "Unverified"}</span></div><div className="mt-4 flex items-center gap-2 border-t border-cream-200 pt-3 text-xs text-ink-500"><Clock3 size={14}/>Customer since {date(details.customer.createdAt)}</div></section>
            <section className="grid grid-cols-3 gap-3"><div className="rounded-xl bg-cream-50 p-3"><p className="text-xs text-ink-500">Orders</p><p className="mt-1 text-xl font-bold text-ink-900">{details.summary.totalOrders}</p></div><div className="rounded-xl bg-cream-50 p-3"><p className="text-xs text-ink-500">Paid orders</p><p className="mt-1 text-xl font-bold text-ink-900">{details.summary.paidOrders}</p></div><div className="rounded-xl bg-cream-50 p-3"><p className="text-xs text-ink-500">Spent</p><p className="mt-1 text-lg font-bold text-ink-900">{currency.format(details.summary.totalSpent)}</p></div></section>
            <section className="overflow-hidden rounded-2xl border border-cream-300"><div className="flex items-center justify-between border-b border-cream-200 px-4 py-3"><div className="flex items-center gap-2 font-semibold text-ink-900"><ShoppingBag size={16}/>Recent orders</div>{details.summary.latestOrderAt && <span className="text-xs text-ink-400">Latest {date(details.summary.latestOrderAt)}</span>}</div>{details.orders.length ? <div className="divide-y divide-cream-200">{details.orders.map(order => <div key={order._id} className="flex items-center justify-between gap-3 px-4 py-3"><div><Link href={`/dashboard/orders/${order._id}`} className="text-sm font-semibold text-blue-700 hover:underline">{order.orderNumber}</Link><p className="mt-1 text-xs text-ink-500">{order.itemCount} item{order.itemCount === 1 ? "" : "s"} · {date(order.createdAt)}</p></div><div className="text-right"><p className="text-sm font-semibold text-ink-900">{currency.format(order.total)}</p><p className="mt-1 text-xs text-ink-500">{order.status.replaceAll("_", " ")}</p></div></div>)}</div> : <div className="px-4 py-8 text-center text-sm text-ink-500"><Mail className="mx-auto mb-2 text-ink-300" size={20}/>No orders linked to this account yet.</div>}</section>
          </div>}
        </aside>
      </div>}
    </>
  );
}
