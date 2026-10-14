"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, CircleDollarSign, Clock3, MapPin, Pencil, Plus, Search, ToggleLeft, ToggleRight, Trash2, Truck, X } from "lucide-react";
import { KENYAN_COUNTIES, type ShippingZone, type CreateShippingZoneInput } from "@baby-shop/shared";
import { shippingAdminApi } from "@/lib/api/endpoints";
import { formatKES } from "@/lib/utils";

type ZoneForm = { county: string; baseFee: string; includedGrams: string; additionalPerKg: string; label: string; etaText: string; isActive: boolean };
const emptyForm = (): ZoneForm => ({ county: "Nairobi", baseFee: "", includedGrams: "5000", additionalPerKg: "50", label: "", etaText: "1-2 business days", isActive: true });

export function ShippingZonesPanel({ initialZones, initialError, canManage = false }: { initialZones: ShippingZone[]; initialError: string; canManage?: boolean }) {
  const [zones, setZones] = useState(initialZones);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [form, setForm] = useState<ZoneForm>(emptyForm());
  const activeCount = zones.filter((zone) => zone.isActive).length;
  const filtered = useMemo(() => zones.filter((zone) => `${zone.county} ${zone.label ?? ""}`.toLowerCase().includes(filter.toLowerCase())), [zones, filter]);

  if (!canManage) return <section className="overflow-hidden rounded-2xl border border-cream-300 bg-white"><div className="divide-y divide-cream-100">{filtered.map((zone) => <div key={zone._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"><div><p className="text-sm font-semibold text-ink-900">{zone.county}</p><p className="text-xs text-ink-500">{zone.label || "Standard delivery"} · {zone.etaText}</p></div><span className="text-sm font-semibold text-ink-800">{formatKES(zone.baseFee)} base fee</span></div>)}</div></section>;

  function startCreate() { setEditing(null); setForm(emptyForm()); setCreating(true); setError(""); }
  function startEdit(zone: ShippingZone) { setCreating(false); setEditing(zone); setForm({ county: zone.county, baseFee: String(zone.baseFee), includedGrams: String(zone.includedGrams), additionalPerKg: String(zone.additionalPerKg), label: zone.label ?? "", etaText: zone.etaText ?? "", isActive: zone.isActive }); setError(""); }
  function closeForm() { setCreating(false); setEditing(null); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const input: CreateShippingZoneInput = { county: form.county, baseFee: Number(form.baseFee), includedGrams: Number(form.includedGrams), additionalPerKg: Number(form.additionalPerKg), label: form.label.trim() || undefined, etaText: form.etaText.trim() || undefined, isActive: form.isActive };
    try {
      if (editing) {
        const { zone } = await shippingAdminApi.update(editing._id, input);
        setZones((current) => current.map((item) => item._id === zone._id ? zone : item).sort((a, b) => a.county.localeCompare(b.county)));
      } else {
        const { zone } = await shippingAdminApi.create(input);
        setZones((current) => [...current, zone].sort((a, b) => a.county.localeCompare(b.county)));
      }
      closeForm();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save shipping zone."); }
    finally { setBusy(false); }
  }

  async function toggle(zone: ShippingZone) {
    setError("");
    try { const { zone: updated } = await shippingAdminApi.update(zone._id, { isActive: !zone.isActive }); setZones((current) => current.map((item) => item._id === updated._id ? updated : item)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update zone."); }
  }

  async function remove(zone: ShippingZone) {
    if (!window.confirm(`Delete the ${zone.county} shipping zone? Existing orders keep their saved shipping fee.`)) return;
    setError("");
    try { await shippingAdminApi.remove(zone._id); setZones((current) => current.filter((item) => item._id !== zone._id)); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not delete zone."); }
  }

  const inputClass = "h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={<MapPin className="h-4 w-4" />} label="Configured counties" value={String(zones.length)} />
      <Metric icon={<Truck className="h-4 w-4" />} label="Checkout enabled" value={String(activeCount)} />
      <Metric icon={<CircleDollarSign className="h-4 w-4" />} label="Fallback rate" value="KSh 800 + weight" />
    </div>
    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 p-4 sm:p-5">
        <div><h2 className="font-semibold text-ink-900">Delivery rates</h2><p className="mt-1 text-xs text-ink-500">Inactive counties use the checkout fallback rate until enabled.</p></div>
        <button onClick={startCreate} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600"><Plus className="h-4 w-4" />Add zone</button>
      </div>
      {(creating || editing) && <form onSubmit={save} className="border-b border-blue-100 bg-blue-50/50 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold text-ink-900">{editing ? `Edit ${editing.county}` : "New shipping zone"}</h3><p className="mt-1 text-xs text-ink-500">Changes affect new checkout quotes. Existing orders retain their saved rates.</p></div><button type="button" onClick={closeForm} aria-label="Close form" className="rounded-lg p-2 text-ink-500 hover:bg-white"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs font-medium text-ink-600">County<select required value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} className={`${inputClass} mt-1`}><option value="" disabled>Select county</option>{[...new Set(KENYAN_COUNTIES)].map((county) => <option key={county} value={county}>{county}</option>)}</select></label>
          <Field label="Base fee (KSh)" type="number" min="0" value={form.baseFee} onChange={(baseFee) => setForm({ ...form, baseFee })} required className={inputClass} />
          <Field label="Included weight (grams)" type="number" min="0" value={form.includedGrams} onChange={(includedGrams) => setForm({ ...form, includedGrams })} required className={inputClass} />
          <Field label="Additional fee per kg (KSh)" type="number" min="0" value={form.additionalPerKg} onChange={(additionalPerKg) => setForm({ ...form, additionalPerKg })} required className={inputClass} />
          <Field label="Zone label (optional)" value={form.label} onChange={(label) => setForm({ ...form, label })} placeholder="Nairobi delivery" className={inputClass} />
          <Field label="Delivery estimate" value={form.etaText} onChange={(etaText) => setForm({ ...form, etaText })} placeholder="1-2 business days" className={inputClass} />
        </div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-blue-500" />Available at checkout</label>
        <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={closeForm} className="h-10 rounded-xl border border-cream-300 bg-white px-4 text-sm">Cancel</button><button disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : <><Check className="h-4 w-4" />Save zone</>}</button></div>
      </form>}
      <div className="border-b border-cream-200 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a county" className={`${inputClass} pl-9`} /></div></div>
      <div className="divide-y divide-cream-100">
        {filtered.map((zone) => <article key={zone._id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-ink-900">{zone.county}</h3>{zone.label && <span className="rounded-full bg-cream-100 px-2.5 py-1 text-[11px] text-ink-600">{zone.label}</span>}<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${zone.isActive ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"}`}>{zone.isActive ? "Active at checkout" : "Inactive"}</span></div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-500"><span className="inline-flex items-center gap-1"><CircleDollarSign className="h-3.5 w-3.5" />{formatKES(zone.baseFee)} base</span><span>{zone.includedGrams.toLocaleString()} g included</span><span>+{formatKES(zone.additionalPerKg)} per kg</span>{zone.etaText && <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{zone.etaText}</span>}</div>
          </div>
          <div className="flex items-center gap-1"><button onClick={() => toggle(zone)} title={zone.isActive ? "Disable at checkout" : "Enable at checkout"} className="rounded-lg p-2 text-ink-500 hover:bg-cream-100">{zone.isActive ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}</button><button onClick={() => startEdit(zone)} aria-label={`Edit ${zone.county}`} className="rounded-lg p-2 text-ink-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(zone)} aria-label={`Delete ${zone.county}`} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div>
        </article>)}
        {!filtered.length && <div className="px-5 py-12 text-center"><Truck className="mx-auto h-8 w-8 text-ink-300" /><p className="mt-3 font-semibold text-ink-800">{zones.length ? "No matching counties" : "No shipping zones yet"}</p><p className="mt-1 text-sm text-ink-500">{zones.length ? "Try another county name." : "Add a zone to set the checkout delivery rate for a county."}</p></div>}
      </div>
    </section>
    <p className="text-xs text-ink-400">Checkout calculates the total from the active county rate and the cart’s item weights. When no active county rate exists, it uses the fallback shown above.</p>
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{icon}</span><div><p className="text-xs text-ink-500">{label}</p><p className="mt-0.5 font-semibold text-ink-900">{value}</p></div></div>; }
function Field({ label, value, onChange, className, ...props }: { label: string; value: string; onChange: (value: string) => void; className: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) { return <label className="text-xs font-medium text-ink-600">{label}<input {...props} value={value} onChange={(event) => onChange(event.target.value)} className={`${className} mt-1`} /></label>; }
