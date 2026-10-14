"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, KeyRound, LoaderCircle, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import { authApi } from "@/lib/api/endpoints";
import type { SessionUser } from "@/lib/auth/session";

export function AccountSettingsForm({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    try {
      await authApi.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || undefined });
      setSaved(true);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't save your profile. Please try again."); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-3xl space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Personal details</p><h2 className="mt-1 text-2xl font-bold text-ink-900">Account settings</h2><p className="mt-1 text-sm text-ink-500">Keep your contact details up to date for a smoother checkout and delivery.</p></header>
    <section className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-cream-200 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><UserRound size={18}/></span><div><h3 className="font-semibold text-ink-900">Your profile</h3><p className="text-xs text-ink-500">The name couriers and our team will see.</p></div></div><form onSubmit={save} className="space-y-4 p-5">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}{saved && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"><BadgeCheck size={16}/>Your profile has been updated.</p>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="First name"><input required minLength={1} maxLength={60} value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" className={input}/></Field><Field label="Last name"><input required minLength={1} maxLength={60} value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" className={input}/></Field><Field label="Phone number"><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="0712 345 678" inputMode="tel" autoComplete="tel" className={input}/></Field><Field label="Email address"><div className={`${input} flex items-center gap-2 bg-cream-50 text-ink-500`}><Mail size={15} className="shrink-0"/><span className="min-w-0 flex-1 truncate">{user?.email ?? "—"}</span>{user?.isEmailVerified && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><BadgeCheck size={13}/>Verified</span>}</div></Field></div>
      <div className="flex justify-end border-t border-cream-100 pt-4"><button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <Save size={16}/>}Save changes</button></div>
    </form></section>
    <section className="flex flex-col gap-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sage-50 text-sage-700"><ShieldCheck size={20}/></span><div className="flex-1"><h3 className="font-semibold text-ink-900">Password and security</h3><p className="mt-1 text-sm leading-5 text-ink-500">Reset your password using a secure email verification code.</p></div><Link href="/forgot-password" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-cream-300 px-4 text-sm font-semibold text-ink-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><KeyRound size={15}/>Reset password</Link></section>
  </div>;
}

const input = "h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-800 outline-none transition placeholder:text-ink-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5"><span className="text-xs font-semibold text-ink-600">{label}</span>{children}</label>; }
