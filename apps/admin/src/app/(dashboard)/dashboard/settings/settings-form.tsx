"use client";

import { useState } from "react";
import { Banknote, Check, LoaderCircle, Save, Store } from "lucide-react";
import { adminApi, type StoreSettings } from "@/lib/api/endpoints";

export function SettingsForm({ initialSettings, canManage = false }: { initialSettings: StoreSettings; canManage?: boolean }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function change<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSaved(false);
    setSettings(previous => ({ ...previous, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setSaved(false); setError("");
    try { const result = await adminApi.updateSettings(settings); setSettings(result.settings); setSaved(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save settings"); }
    finally { setBusy(false); }
  }

  const field = "mt-1 h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-800 outline-none focus:border-blue-400";
  if (!canManage) return <section className="max-w-3xl rounded-2xl border border-cream-300 bg-white p-5"><h2 className="font-semibold text-ink-900">Store profile and operations</h2><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{Object.entries(settings).map(([key, value]) => <div key={key} className="rounded-xl bg-cream-50 p-3"><dt className="text-xs capitalize text-ink-500">{key.replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`)}</dt><dd className="mt-1 font-medium text-ink-800">{key === "cashOnDeliveryEnabled" ? (value ? "Enabled" : "Disabled") : String(value)}</dd></div>)}</dl></section>;

  return <form onSubmit={save} className="max-w-3xl space-y-5">
    <section className="rounded-2xl border border-cream-300 bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Store size={18}/></span><div><h2 className="font-semibold text-ink-900">Store profile</h2><p className="mt-1 text-sm text-ink-500">Information used across your store operations.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-ink-700">Store name<input required value={settings.storeName} onChange={event => change("storeName", event.target.value)} className={field}/></label><label className="text-sm font-medium text-ink-700">Currency<input required maxLength={3} value={settings.currency} onChange={event => change("currency", event.target.value.toUpperCase())} className={field}/></label><label className="text-sm font-medium text-ink-700">Support email<input type="email" value={settings.supportEmail} onChange={event => change("supportEmail", event.target.value)} className={field}/></label><label className="text-sm font-medium text-ink-700">Support phone<input value={settings.supportPhone} onChange={event => change("supportPhone", event.target.value)} className={field}/></label><label className="text-sm font-medium text-ink-700 sm:col-span-2">Timezone<input required value={settings.timezone} onChange={event => change("timezone", event.target.value)} className={field}/></label></div></section>
    <section className="rounded-2xl border border-cream-300 bg-white p-5 sm:p-6"><h2 className="font-semibold text-ink-900">Payment options</h2><p className="mt-1 text-sm text-ink-500">Control which payment methods customers can choose at checkout.</p><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-cream-200 p-4 transition hover:border-blue-200"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Banknote size={19}/></span><span className="flex-1"><strong className="block text-sm text-ink-900">Pay on delivery</strong><span className="mt-1 block text-xs leading-5 text-ink-500">Allow customers to pay the courier when their order arrives. Existing COD orders are not affected.</span></span><input type="checkbox" checked={settings.cashOnDeliveryEnabled} onChange={event => change("cashOnDeliveryEnabled", event.target.checked)} className="mt-1 h-4 w-4 accent-blue-600" aria-label="Enable pay on delivery"/></label></section>
    <section className="rounded-2xl border border-cream-300 bg-white p-5 sm:p-6"><h2 className="font-semibold text-ink-900">Operations</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium text-ink-700">Low stock alert threshold<input required type="number" min={0} value={settings.lowStockThreshold} onChange={event => change("lowStockThreshold", Number(event.target.value))} className={field}/><span className="mt-1 block text-xs font-normal text-ink-500">Show inventory alerts when stock reaches this number.</span></label><label className="flex items-start gap-3 rounded-xl bg-cream-50 p-4 text-sm"><input type="checkbox" checked={settings.maintenanceMode} onChange={event => change("maintenanceMode", event.target.checked)} className="mt-0.5 h-4 w-4 accent-blue-500"/><span><strong className="block text-ink-800">Maintenance mode</strong><span className="mt-1 block text-xs text-ink-500">Flag the storefront as temporarily unavailable.</span></span></label></div></section>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex items-center justify-end gap-3">{saved && <span role="status" className="inline-flex items-center gap-1 text-sm font-medium text-green-700"><Check size={15}/>Settings saved</span>}<button disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-semibold text-white disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}{busy ? "Saving…" : "Save settings"}</button></div>
  </form>;
}
