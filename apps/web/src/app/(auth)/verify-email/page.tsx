import Link from "next/link";
import { MailCheck } from "lucide-react";
import { VerifyEmailForm } from "./verify-email-form";

export const metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; next?: string }> }) {
  const params = await searchParams;
  const email = params.email?.trim().toLowerCase() ?? "";
  const candidate = params.next;
  const next = candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/account/orders";

  return <div className="space-y-6">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"><MailCheck className="h-6 w-6" aria-hidden="true"/></div>
    <div className="space-y-2 text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">One quick step</p><h1 className="font-display text-3xl text-ink-900">Verify your email</h1><p className="mx-auto max-w-sm text-sm leading-6 text-ink-500">Enter your six-digit code to activate your account. If you never received one, request a fresh code below.</p></div>
    <VerifyEmailForm email={email} next={next}/>
    <div className="text-center text-sm text-ink-500">Want to use a different account? <Link href="/login" className="font-semibold text-blue-600 hover:underline">Back to sign in</Link></div>
  </div>;
}
