"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Minus, Plus, Search, ShoppingBag, Smartphone, Trash2 } from "lucide-react";
import { adminApi, type PosProduct } from "@/lib/api/endpoints";

type Line = { variantId: string; quantity: number; product: PosProduct; variant: PosProduct["variants"][number] };
const money = (n: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
const validKenyanMpesaPhone = (value: string) => /^(?:\+?254|0)?[17]\d{8}$/.test(value.trim().replace(/[\s()-]/g, ""));

export function NewSalePanel() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [cart, setCart] = useState<Line[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MPESA">("CASH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingPayment, setPendingPayment] = useState<{ id: string; phone: string; number: string } | null>(null);
  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.variant.price * line.quantity, 0), [cart]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => adminApi.posProducts(query).then((res) => { if (active) setProducts(res.items); }).catch((err) => { if (active) setError(err instanceof Error ? err.message : "Could not load products."); }), 180);
    return () => { active = false; clearTimeout(timeout); };
  }, [query]);

  function add(product: PosProduct, variant: PosProduct["variants"][number]) {
    setError(""); setNotice("");
    if (variant.stock < 1) return;
    setCart((current) => {
      const existing = current.find((line) => line.variantId === variant._id);
      if (existing) return current.map((line) => line.variantId === variant._id ? { ...line, quantity: Math.min(line.quantity + 1, variant.stock) } : line);
      return [...current, { variantId: variant._id, quantity: 1, product, variant }];
    });
  }

  function changeQuantity(variantId: string, delta: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.variantId !== variantId) return [line];
      const quantity = Math.min(line.variant.stock, line.quantity + delta);
      return quantity > 0 ? [{ ...line, quantity }] : [];
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!cart.length) { setError("Add at least one product to this sale."); return; }
    const form = new FormData(event.currentTarget);
    const customerName = String(form.get("customerName") ?? "").trim();
    const customerPhone = String(form.get("customerPhone") ?? "").trim();
    setBusy(true); setError(""); setNotice("");
    try {
      if (paymentMethod === "MPESA" && !validKenyanMpesaPhone(customerPhone)) throw new Error("Enter an active Kenyan M-Pesa number in the format 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX.");
      const { order } = await adminApi.createPosSale({ customerName, customerPhone: customerPhone || undefined, customerEmail: String(form.get("customerEmail") ?? "") || undefined, paymentMethod, items: cart.map(({ variantId, quantity }) => ({ variantId, quantity })), notes: String(form.get("notes") ?? "") || undefined });
      if (paymentMethod === "MPESA") {
        setPendingPayment({ id: order._id, phone: customerPhone, number: order.orderNumber });
        try { await adminApi.promptPosMpesa(order._id, customerPhone); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "The sale is saved, but the M-Pesa prompt could not be sent."); return; }
        setPendingPayment(null);
        setNotice(`M-Pesa prompt sent to ${customerPhone}. Sale ${order.orderNumber} will appear as delivered after payment is confirmed.`);
      } else {
        setNotice(`Cash sale ${order.orderNumber} completed and added to delivered orders.`);
      }
      setCart([]); formElement.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete this sale.");
    } finally { setBusy(false); }
  }

  async function retryPaymentPrompt() {
    if (!pendingPayment) return;
    setBusy(true); setError("");
    try {
      await adminApi.promptPosMpesa(pendingPayment.id, pendingPayment.phone);
      setNotice(`M-Pesa prompt sent to ${pendingPayment.phone}. Sale ${pendingPayment.number} will appear as delivered after payment is confirmed.`);
      setPendingPayment(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send the M-Pesa prompt."); }
    finally { setBusy(false); }
  }

  const input = "h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,.8fr)]">
    <section className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm">
      <div className="border-b border-cream-200 p-5"><div className="mb-4"><h2 className="font-semibold text-ink-900">Add products</h2><p className="mt-1 text-sm text-ink-500">Search the live catalog and choose a product option.</p></div><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product name or SKU" className={`${input} pl-10`} /></label></div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-3">{products.map((product) => <article key={product._id} className="overflow-hidden rounded-xl border border-cream-200"><div className="flex gap-3 p-3">{product.image ? <img src={product.image} alt="" className="h-14 w-14 rounded-lg bg-cream-50 object-cover" /> : <div className="grid h-14 w-14 place-items-center rounded-lg bg-cream-50 text-ink-400"><ShoppingBag className="h-5 w-5" /></div>}<div className="min-w-0"><h3 className="line-clamp-2 text-sm font-semibold text-ink-900">{product.name}</h3><p className="mt-1 text-xs text-ink-500">{product.variants.length} option{product.variants.length === 1 ? "" : "s"}</p></div></div><div className="space-y-2 border-t border-cream-100 bg-cream-50/60 p-2">{product.variants.map((variant) => <button key={variant._id} type="button" disabled={variant.stock < 1} onClick={() => add(product, variant)} className="flex w-full items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-left text-xs transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-45"><span className="min-w-0 truncate text-ink-700">{[variant.size, variant.color, variant.sku].filter(Boolean).join(" · ")} <span className="text-ink-400">({variant.stock} left)</span></span><span className="shrink-0 font-semibold text-ink-900">{money(variant.price)}</span></button>)}</div></article>)}{!products.length && <div className="col-span-full py-12 text-center text-sm text-ink-500">No matching products found.</div>}</div>
    </section>

    <form onSubmit={submit} className="h-fit overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm xl:sticky xl:top-5">
      <div className="flex items-center justify-between border-b border-cream-200 p-5"><div><h2 className="font-semibold text-ink-900">Current sale</h2><p className="mt-1 text-xs text-ink-500">{cart.reduce((n, line) => n + line.quantity, 0)} item(s)</p></div><ShoppingBag className="h-5 w-5 text-blue-600" /></div>
      {error && <div role="alert" className="mx-4 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"><p>{error}</p>{pendingPayment && <button type="button" onClick={retryPaymentPrompt} disabled={busy} className="mt-2 font-semibold underline">Retry M-Pesa prompt for {pendingPayment.number}</button>}</div>}{notice && <p role="status" className="mx-4 mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="max-h-64 divide-y divide-cream-100 overflow-y-auto px-4">{cart.map((line) => <div key={line.variantId} className="flex items-center gap-2 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink-900">{line.product.name}</p><p className="text-xs text-ink-500">{[line.variant.size, line.variant.color, line.variant.sku].filter(Boolean).join(" · ")} · {money(line.variant.price)}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => changeQuantity(line.variantId, -1)} className="grid h-7 w-7 place-items-center rounded-lg border border-cream-200"><Minus className="h-3 w-3" /></button><span className="w-6 text-center text-sm">{line.quantity}</span><button type="button" onClick={() => changeQuantity(line.variantId, 1)} disabled={line.quantity >= line.variant.stock} className="grid h-7 w-7 place-items-center rounded-lg border border-cream-200 disabled:opacity-40"><Plus className="h-3 w-3" /></button></div><span className="w-20 text-right text-sm font-semibold">{money(line.variant.price * line.quantity)}</span><button type="button" aria-label="Remove item" onClick={() => setCart((current) => current.filter((item) => item.variantId !== line.variantId))} className="text-ink-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>)}{!cart.length && <div className="py-8 text-center text-sm text-ink-400">Your sale is empty. Add a product to begin.</div>}</div>
      <div className="space-y-3 border-t border-cream-200 p-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><input name="customerName" required placeholder="Customer name" className={input} /><div><input name="customerPhone" required={paymentMethod === "MPESA"} type="tel" inputMode="tel" autoComplete="tel" placeholder={paymentMethod === "MPESA" ? "Customer phone for M-Pesa" : "Customer phone (optional)"} className={input} />{paymentMethod === "MPESA" && <p className="mt-1 text-xs text-ink-500">Use 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX. We’ll normalize the number before sending the prompt.</p>}</div><input name="customerEmail" type="email" placeholder="Email (optional)" className={input} /></div>
        <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Payment method</legend><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setPaymentMethod("CASH")} className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${paymentMethod === "CASH" ? "border-blue-500 bg-blue-50 text-blue-800" : "border-cream-300 text-ink-600"}`}><Check className="h-4 w-4" />Cash</button><button type="button" onClick={() => setPaymentMethod("MPESA")} className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${paymentMethod === "MPESA" ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-cream-300 text-ink-600"}`}><Smartphone className="h-4 w-4" />M-Pesa</button></div></fieldset>
        {paymentMethod === "MPESA" && <p className="rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">We’ll send an STK prompt to the customer’s phone. The order is marked delivered only after M-Pesa confirms payment.</p>}
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-500">Sale note <span className="font-normal">(optional)</span></span><input name="notes" placeholder="Add a note" className={input} /></label>
        <div className="flex items-center justify-between border-t border-cream-100 pt-3"><span className="text-sm font-medium text-ink-600">Total</span><span className="text-xl font-bold text-ink-900">{money(subtotal)}</span></div>
        <button type="submit" disabled={busy || !cart.length} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : paymentMethod === "MPESA" ? <Smartphone className="h-4 w-4" /> : <Check className="h-4 w-4" />}{busy ? "Processing…" : paymentMethod === "MPESA" ? "Prompt M-Pesa & create sale" : "Complete cash sale"}</button>
      </div>
    </form>
  </div>;
}
