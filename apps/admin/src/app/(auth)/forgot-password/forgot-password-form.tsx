"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { ArrowLeft, Check, CircleAlert, Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { adminForgotPasswordAction, adminResetPasswordAction, type ActionState } from "../actions";

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [sendState, sendAction] = useActionState<ActionState | undefined, FormData>(adminForgotPasswordAction, undefined);
  const [resetState, resetAction] = useActionState<ActionState | undefined, FormData>(adminResetPasswordAction, undefined);

  useEffect(() => { if (sendState?.success) setSent(true); }, [sendState]);
  useEffect(() => { if (resetState?.success) setComplete(true); }, [resetState]);

  if (complete) return <div className="py-3">
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><Check className="h-7 w-7" strokeWidth={2.5} /></div>
    <h2 className="text-xl font-semibold text-ink-900">Password updated</h2>
    <p className="mt-2 text-sm leading-6 text-ink-500">Your admin password has been changed. Sign in with the new password to continue.</p>
    <Link href="/login" className="mt-7 flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-md shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"><ShieldCheck className="h-4 w-4" />Return to sign in</Link>
  </div>;

  const error = sent ? (sendState?.success ? undefined : resetState?.error ?? sendState?.error) : sendState?.error;
  return <>
    <div className="mb-7 grid grid-cols-2 gap-2" aria-label={`Step ${sent ? "2" : "1"} of 2`}>
      <Step number="1" label="Request code" active={!sent} complete={sent} />
      <Step number="2" label="Choose password" active={sent} complete={false} />
    </div>

    {error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><p>{error.message}</p></div>}

    {sent ? <form action={resetAction} className="space-y-5">
      <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm leading-5 text-blue-950">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm"><Mail className="h-4 w-4" /></div>
        <div><p className="font-semibold">Check your inbox</p><p className="mt-1 text-blue-900/75">If an account exists for <strong className="font-semibold">{email}</strong>, a six-digit code is on its way. It expires in 10 minutes.</p></div>
      </div>
      <input type="hidden" name="email" value={email} />
      <Field label="Verification code" name="code" placeholder="Enter 6-digit code" maxLength={6} inputMode="numeric" autoComplete="one-time-code" code />
      <PasswordField />
      <SubmitButton pendingText="Updating password…"><KeyRound className="h-4 w-4" />Save new password</SubmitButton>
      <div className="flex flex-col items-center gap-2 pt-1 sm:flex-row sm:justify-between">
        <button formAction={sendAction} className="text-sm font-semibold text-blue-700 transition hover:text-blue-900">Resend code</button>
        <button type="button" onClick={() => { setSent(false); setEmail(""); }} className="text-sm text-ink-500 transition hover:text-ink-800">Use another email</button>
      </div>
    </form> : <form action={sendAction} onSubmit={(event) => setEmail(String(new FormData(event.currentTarget).get("email") ?? "").trim().toLowerCase())} className="space-y-5">
      <Field label="Admin email address" name="email" type="email" placeholder="name@babycentre.co.ke" defaultValue={email} autoComplete="email" />
      <p className="-mt-2 text-xs leading-5 text-ink-500">Enter the email address associated with your admin account.</p>
      <SubmitButton pendingText="Sending secure code…"><Mail className="h-4 w-4" />Email me a reset code</SubmitButton>
    </form>}

    {!complete && <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition hover:text-ink-900"><ArrowLeft className="h-4 w-4" />Back to admin sign in</Link>}
  </>;
}

function Step({ number, label, active, complete }: { number: string; label: string; active: boolean; complete: boolean }) {
  return <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${active ? "border-blue-200 bg-blue-50/70" : complete ? "border-emerald-100 bg-emerald-50/60" : "border-ink-100 bg-white"}`}>
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-blue-700 text-white" : complete ? "bg-emerald-600 text-white" : "bg-ink-100 text-ink-500"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : number}</span>
    <span className={`text-xs font-semibold sm:text-sm ${active ? "text-blue-900" : complete ? "text-emerald-900" : "text-ink-400"}`}>{label}</span>
  </div>;
}

function Field(props: { label: string; name: string; type?: string; placeholder: string; defaultValue?: string; autoComplete?: string; maxLength?: number; inputMode?: "numeric" | "text"; code?: boolean }) {
  return <label htmlFor={props.name} className="block space-y-2 text-sm font-semibold text-ink-700">
    {props.label}
    <input id={props.name} name={props.name} type={props.type ?? "text"} placeholder={props.placeholder} defaultValue={props.defaultValue} required autoComplete={props.autoComplete} maxLength={props.maxLength} inputMode={props.inputMode} aria-label={props.label} className={`h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm font-normal text-ink-900 outline-none transition placeholder:text-ink-400 hover:border-ink-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${props.code ? "text-center font-mono text-lg tracking-[.35em]" : ""}`} />
  </label>;
}

function PasswordField() {
  const [visible, setVisible] = useState(false);
  return <label htmlFor="password" className="block space-y-2 text-sm font-semibold text-ink-700">New password
    <span className="relative block">
      <input id="password" name="password" type={visible ? "text" : "password"} placeholder="Create a strong password" required autoComplete="new-password" className="h-12 w-full rounded-xl border border-ink-200 bg-white px-4 pr-12 text-sm font-normal text-ink-900 outline-none transition placeholder:text-ink-400 hover:border-ink-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
      <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-400 transition hover:text-ink-700">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
    </span>
    <span className="block text-xs font-normal leading-5 text-ink-500">At least 8 characters, with uppercase, lowercase, and a number.</span>
  </label>;
}

function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-md shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-wait disabled:opacity-60">{pending ? <><Loader2 className="h-4 w-4 animate-spin" />{pendingText}</> : children}</button>;
}
