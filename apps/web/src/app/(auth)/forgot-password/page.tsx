import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <MailCheck className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl text-ink-900">Reset your password</h1>
        <p className="mx-auto max-w-sm text-sm leading-6 text-ink-500">
          We’ll email you a secure, one-time code so you can get back to your account.
        </p>
      </div>
      <ForgotPasswordForm />
      <div className="text-center text-sm text-ink-500">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
