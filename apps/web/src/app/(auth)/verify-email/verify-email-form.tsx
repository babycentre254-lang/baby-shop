"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Mail, RefreshCw } from "lucide-react";
import { verifyEmailAction, resendVerificationAction, type ActionState } from "../actions";

export function VerifyEmailForm({ email, next }: { email: string; next: string }) {
  const router = useRouter();
  const [verifyState, verifyAction, verifyPending] = useActionState<ActionState | undefined, FormData>(verifyEmailAction, undefined);
  const [resendState, resendAction, resendPending] = useActionState<ActionState | undefined, FormData>(resendVerificationAction, undefined);

  useEffect(() => {
    if (verifyState?.success) { router.replace(next); router.refresh(); }
  }, [verifyState, router, next]);

  return <div className="space-y-4">
    {!email ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Enter the email address you used to register, then request a new verification code.</div> : <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-blue-600"><Mail size={17}/></span><div className="min-w-0"><p className="text-xs text-blue-800">Verification code sent to</p><p className="truncate text-sm font-semibold text-blue-950">{email}</p></div></div>}

    {verifyState?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{verifyState.error.message}</div>}
    {resendState?.success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">If this account still needs verification, a fresh code is on its way. Check your inbox and spam folder.</div>}
    {resendState?.error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{resendState.error.message}</div>}

    {email && <form action={verifyAction} className="space-y-4"><input type="hidden" name="email" value={email}/><label className="block space-y-1.5"><span className="text-sm font-medium text-ink-700">Email verification code</span><input name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus className="h-14 w-full rounded-xl border border-ink-200 bg-white px-4 text-center font-mono text-2xl tracking-[0.45em] text-ink-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" placeholder="000000"/><span className="block text-xs text-ink-500">The code expires after 10 minutes.</span></label><button disabled={verifyPending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{verifyPending ? <LoaderCircle size={17} className="animate-spin"/> : null}Verify email and continue <ArrowRight size={16}/></button></form>}

    <form action={resendAction} className="space-y-3 rounded-xl border border-cream-200 bg-white p-4"><label className="block space-y-1.5"><span className="text-xs font-semibold text-ink-600">{email ? "Didn't receive a code?" : "Email address"}</span><input type="email" name="email" defaultValue={email} required placeholder="you@example.com" autoComplete="email" readOnly={Boolean(email)} className="h-11 w-full rounded-xl border border-cream-300 bg-white px-3 text-sm text-ink-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 read-only:bg-cream-50"/></label><button disabled={resendPending} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-cream-300 text-sm font-semibold text-ink-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60">{resendPending ? <LoaderCircle size={15} className="animate-spin"/> : <RefreshCw size={15}/>}Send a new code</button></form>
  </div>;
}
