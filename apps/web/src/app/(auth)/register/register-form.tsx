"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { registerAction, verifyEmailAction, resendVerificationAction, type ActionState } from "../actions";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert } from "@/components/forms/alert";

export function RegisterForm() {
  const router = useRouter();

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    registerAction,
    undefined
  );
  const [verifyState, verifyAction] = useActionState<ActionState | undefined, FormData>(verifyEmailAction, undefined);
  const [resendState, resendAction] = useActionState<ActionState | undefined, FormData>(resendVerificationAction, undefined);

  useEffect(() => {
    if (verifyState?.success) {
      router.push("/account/orders");
      router.refresh();
    }
  }, [verifyState, router]);

  if (state?.verificationRequired) {
    return (
      <div className="space-y-5">
        <Alert variant="info" title="Verify your email">We sent a six-digit code to <strong>{state.email}</strong>. Enter it below to activate your account.</Alert>
        {verifyState?.error && <Alert variant="error">{verifyState.error.message}</Alert>}
        {resendState?.success && <Alert variant="success">If verification is needed, a fresh code is on its way.</Alert>}
        {resendState?.error && <Alert variant="error">{resendState.error.message}</Alert>}
        <form action={verifyAction} className="space-y-4">
          <input type="hidden" name="email" value={state.email} />
          <FormField label="Verification code" name="code" placeholder="000000" required autoComplete="one-time-code" inputMode="numeric" maxLength={6} errors={verifyState?.error?.details?.code} hint="The code expires after 10 minutes." />
          <SubmitButton className="w-full" size="lg" loadingText="Verifying…">Verify email</SubmitButton>
        </form>
        <form action={resendAction}><input type="hidden" name="email" value={state.email} /><button className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700">Send a new code</button></form>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && !state.error.details && (
        <Alert variant="error">{state.error.message}</Alert>
      )}
      {state?.error?.details?.email && <Alert variant="error">{state.error.details.email[0]}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="First name"
          name="firstName"
          placeholder="Jane"
          required
          autoComplete="given-name"
          errors={state?.error?.details?.firstName}
        />
        <FormField
          label="Last name"
          name="lastName"
          placeholder="Wanjiru"
          required
          autoComplete="family-name"
          errors={state?.error?.details?.lastName}
        />
      </div>

      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        required
        autoComplete="email"
        errors={state?.error?.details?.email}
      />

      <FormField
        label="Phone (optional)"
        name="phone"
        type="tel"
        placeholder="0712 345 678"
        autoComplete="tel"
        hint="Kenyan number. Used for delivery updates."
        errors={state?.error?.details?.phone}
      />

      <PasswordInput
        label="Password"
        name="password"
        placeholder="••••••••"
        required
        autoComplete="new-password"
        hint="At least 8 characters, with a number, an uppercase, and a lowercase letter."
        errors={state?.error?.details?.password}
      />

      <label className="flex items-start gap-2 text-sm text-ink-600 cursor-pointer">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-blue-500 focus:ring-blue-400"
        />
        <span>
          I agree to the{" "}
          <a href="/terms" className="text-blue-500 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-blue-500 hover:underline">
            Privacy Policy
          </a>
        </span>
      </label>

      <SubmitButton className="w-full" size="lg" loadingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
