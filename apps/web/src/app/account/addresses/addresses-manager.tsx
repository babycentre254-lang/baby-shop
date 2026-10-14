"use client";

import { useState } from "react";
import { BadgeCheck, Check, Home, LoaderCircle, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { KENYAN_COUNTIES, type Address, type CreateAddressInput } from "@baby-shop/shared";
import { addressesApi } from "@/lib/api/endpoints";

type Draft = CreateAddressInput;
const emptyDraft = (): Draft => ({ label: "Home", fullName: "", phone: "", county: "Nairobi", town: "", street: "", notes: "", isDefault: false });
const counties = [...new Set(KENYAN_COUNTIES)];

export function AddressesManager({ initialAddresses, unavailable }: { initialAddresses: Address[]; unavailable: boolean }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function startAdd() { setEditing(null); setDraft({ ...emptyDraft(), isDefault: addresses.length === 0 }); setError(""); setNotice(""); setOpen(true); }
  function startEdit(address: Address) { setEditing(address); setDraft({ label: address.label, fullName: address.fullName, phone: address.phone, county: address.county, town: address.town, street: address.street, notes: address.notes ?? "", isDefault: address.isDefault }); setError(""); setNotice(""); setOpen(true); }
  function close() { setOpen(false); setEditing(null); }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (editing) {
        const { address } = await addressesApi.update(editing._id, draft);
        setAddresses(current => current.map(item => ({ ...item, ...(draft.isDefault ? { isDefault: false } : {}), ...(item._id === address._id ? address : {}) })));
      } else {
        const { address } = await addressesApi.create(draft);
        setAddresses(current => [...current.map(item => ({ ...item, ...(address.isDefault ? { isDefault: false } : {}) })), address]);
      }
      close(); setNotice(editing ? "Address updated." : "Address saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't save this address. Check the details and try again."); }
    finally { setBusy(false); }
  }

  async function remove(address: Address) {
    if (!window.confirm(`Remove the ${address.label.toLowerCase()} address?`)) return;
    setBusy(true); setError("");
    try { await addressesApi.remove(address._id); setAddresses(current => current.filter(item => item._id !== address._id)); setNotice("Address removed."); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't remove this address."); }
    finally { setBusy(false); }
  }

  async function makeDefault(address: Address) {
    setBusy(true); setError("");
    try {
      const { address: updated } = await addressesApi.update(address._id, { isDefault: true });
      setAddresses(current => current.map(item => ({ ...item, isDefault: item._id === updated._id })));
      setNotice(`${address.label} is now your default delivery address.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Couldn't update your default address."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Delivery details</p><h2 className="mt-1 text-2xl font-bold text-ink-900">Saved addresses</h2><p className="mt-1 text-sm text-ink-500">Choose where your orders should arrive. Your default is selected at checkout.</p></div><button onClick={startAdd} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><Plus size={17}/>Add address</button></div>
    {unavailable && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">We couldn't load saved addresses. You can retry by refreshing this page.</div>}
    {error && !open && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
    {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check size={16}/>{notice}<button onClick={() => setNotice("")} className="ml-auto text-xs font-semibold">Dismiss</button></div>}
    {addresses.length === 0 ? <section className="rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-12 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><MapPin size={25}/></div><h3 className="mt-4 text-lg font-semibold text-ink-900">No addresses saved yet</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-ink-500">Save your delivery details once to make your next checkout quicker.</p><button onClick={startAdd} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16}/>Add your first address</button></section> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{addresses.map(address => <article key={address._id} className={`group relative rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${address.isDefault ? "border-blue-300 ring-1 ring-blue-100" : "border-cream-200"}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-xl ${address.isDefault ? "bg-blue-50 text-blue-700" : "bg-cream-100 text-ink-500"}`}>{address.label.toLowerCase().includes("home") ? <Home size={19}/> : <MapPin size={19}/>}</div><div><h3 className="font-semibold text-ink-900">{address.label}</h3>{address.isDefault && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700"><BadgeCheck size={12}/>Default delivery</span>}</div></div><div className="flex gap-1"><button onClick={() => startEdit(address)} aria-label={`Edit ${address.label} address`} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-blue-50 hover:text-blue-700"><Pencil size={15}/></button><button onClick={() => void remove(address)} disabled={busy || address.isDefault} title={address.isDefault ? "Set another address as default before removing this one" : "Remove address"} aria-label={`Remove ${address.label} address`} className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35"><Trash2 size={15}/></button></div></div><div className="mt-5 space-y-1.5 border-t border-cream-100 pt-4 text-sm"><p className="font-medium text-ink-800">{address.fullName}</p><p className="text-ink-500">{address.phone}</p><p className="leading-5 text-ink-600">{address.street}<br/>{address.town}, {address.county}</p>{address.notes && <p className="mt-2 text-xs text-ink-400">Delivery note: {address.notes}</p>}</div>{!address.isDefault && <button disabled={busy} onClick={() => void makeDefault(address)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50"><Star size={13}/>Make default</button>}</article>)}</div>}
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 p-0 sm:items-center sm:p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) close(); }}><section role="dialog" aria-modal="true" aria-labelledby="address-form-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Delivery address</p><h3 id="address-form-title" className="mt-1 text-xl font-bold text-ink-900">{editing ? "Edit address" : "Add a new address"}</h3><p className="mt-1 text-sm text-ink-500">Enter a Kenyan phone number so the courier can reach you.</p></div><button onClick={close} disabled={busy} aria-label="Close address form" className="grid h-9 w-9 place-items-center rounded-xl border border-cream-200 text-ink-500 hover:bg-cream-50"><X size={17}/></button></div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Address label"><select value={draft.label} onChange={event => setDraft({ ...draft, label: event.target.value })} className={input}><option>Home</option><option>Work</option><option>Family</option><option>Other</option></select></Field><Field label="Recipient name"><input required minLength={2} maxLength={120} value={draft.fullName} onChange={event => setDraft({ ...draft, fullName: event.target.value })} placeholder="Full name" className={input}/></Field><Field label="Phone number"><input required value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} placeholder="0712 345 678" inputMode="tel" className={input}/></Field><Field label="County"><select required value={draft.county} onChange={event => setDraft({ ...draft, county: event.target.value })} className={input}>{counties.map(county => <option key={county}>{county}</option>)}</select></Field><Field label="Town / area"><input required minLength={2} maxLength={80} value={draft.town} onChange={event => setDraft({ ...draft, town: event.target.value })} placeholder="e.g. Westlands" className={input}/></Field><Field label="Street / estate"><input required minLength={2} maxLength={200} value={draft.street} onChange={event => setDraft({ ...draft, street: event.target.value })} placeholder="Building, estate, road" className={input}/></Field></div><Field label="Delivery instructions (optional)"><textarea maxLength={300} rows={2} value={draft.notes ?? ""} onChange={event => setDraft({ ...draft, notes: event.target.value })} placeholder="Landmark or directions for the courier" className={`${input} h-auto py-2.5`}/></Field><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-200 bg-cream-50/70 p-3"><input type="checkbox" checked={draft.isDefault} disabled={Boolean(editing?.isDefault)} onChange={event => setDraft({ ...draft, isDefault: event.target.checked })} className="mt-0.5 h-4 w-4 accent-blue-600 disabled:opacity-70"/><span><span className="block text-sm font-medium text-ink-800">Set as default address</span><span className="mt-0.5 block text-xs text-ink-500">{editing?.isDefault ? "This is your default address. Set another address as default to switch it." : "Use this address automatically at checkout."}</span></span></label><div className="flex flex-col-reverse gap-2 border-t border-cream-100 pt-4 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={close} className="h-11 rounded-xl border border-cream-300 px-4 text-sm font-semibold text-ink-700 hover:bg-cream-50">Cancel</button><button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy && <LoaderCircle size={16} className="animate-spin"/>}{editing ? "Save changes" : "Save address"}</button></div></form>
    </section></div>}
  </div>;
}

const input = "h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5"><span className="text-xs font-semibold text-ink-600">{label}</span>{children}</label>; }
