"use client";

import { useState } from "react";
import { Check, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api/endpoints";

export function SecuritySettings({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (password !== confirmation) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword, password });
      setCurrentPassword("");
      setPassword("");
      setConfirmation("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setBusy(false);
    }
  }

  const field = "mt-1 h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-800 outline-none focus:border-blue-400";
  return <section className="max-w-3xl rounded-2xl border border-cream-300 bg-white p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck size={19}/></span><div><h2 className="font-semibold text-ink-900">Account security</h2><p className="mt-1 text-sm text-ink-500">Signed in as {email}</p></div></div>
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-ink-700">Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className={field}/></label><span className="hidden sm:block"/></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-ink-700">New password<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className={field}/></label><label className="text-sm font-medium text-ink-700">Confirm new password<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className={field}/></label></div>
      <p className="text-xs text-ink-500">Use at least 8 characters with an uppercase letter, a lowercase letter, and a number. Changing your password signs out other sessions.</p>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex items-center justify-end gap-3">{saved && <span role="status" className="inline-flex items-center gap-1 text-sm font-medium text-green-700"><Check size={15}/>Password updated</span>}<button disabled={busy || !currentPassword || !password || !confirmation} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-semibold text-white disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <KeyRound className="h-4 w-4"/>}{busy ? "Updating…" : "Update password"}</button></div>
    </form>
  </section>;
}
