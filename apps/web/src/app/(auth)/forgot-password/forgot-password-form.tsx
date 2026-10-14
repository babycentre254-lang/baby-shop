"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { forgotPasswordAction, resetPasswordAction, type ActionState } from "../actions";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert } from "@/components/forms/alert";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [complete, setComplete] = useState(false);
  const [sendState, sendAction] = useActionState<ActionState | undefined, FormData>(forgotPasswordAction, undefined);
  const [resetState, resetAction] = useActionState<ActionState | undefined, FormData>(resetPasswordAction, undefined);

  useEffect(() => {
    if (sendState?.success) setCodeSent(true);
  }, [sendState]);
  useEffect(() => {
    if (resetState?.success) setComplete(true);
  }, [resetState]);

  if (complete) {
    return (
      <div className="space-y-5 text-center">
        <Alert variant="success" title="Password updated">
          Your password is ready. Sign in with your new password to continue.
        </Alert>
        <Link href="/login" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
          Go to sign in
        </Link>
      </div>
    );
  }

  if (codeSent) {
    return (
      <form action={resetAction} className="space-y-5">
        {resetState?.error && !resetState.error.details && <Alert>{resetState.error.message}</Alert>}
        {sendState?.error && <Alert>{sendState.error.message}</Alert>}
        <Alert variant="info" title="Check your inbox">
          If an account exists for <strong>{email}</strong>, we’ve sent a six-digit code. It expires in 10 minutes.
        </Alert>
        <input type="hidden" name="email" value={email} />
        <FormField
          label="Email verification code"
          name="code"
          type="text"
          placeholder="000000"
          required
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          errors={resetState?.error?.details?.code}
          hint="Enter the 6-digit code from the email."
        />
        <PasswordInput
          label="New password"
          name="password"
          placeholder="Create a strong password"
          required
          autoComplete="new-password"
          hint="At least 8 characters, with uppercase, lowercase, and a number."
          errors={resetState?.error?.details?.password}
        />
        <SubmitButton className="w-full" size="lg" loadingText="Updating password…">
          Save new password
        </SubmitButton>
        <button
          type="submit"
          formAction={sendAction}
          className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Send another code
        </button>
        <button type="button" onClick={() => setCodeSent(false)} className="w-full text-sm font-medium text-blue-600 hover:text-blue-700">
          Use a different email address
        </button>
      </form>
    );
  }

  return (
    <form
      action={sendAction}
      onSubmit={(event) => {
        const value = new FormData(event.currentTarget).get("email");
        setEmail(String(value ?? "").trim().toLowerCase());
      }}
      className="space-y-5"
    >
      {sendState?.error && !sendState.error.details && <Alert>{sendState.error.message}</Alert>}
      <FormField
        label="Email address"
        name="email"
        type="email"
        placeholder="you@example.com"
        defaultValue={email}
        required
        autoComplete="email"
        errors={sendState?.error?.details?.email}
      />
      <SubmitButton className="w-full" size="lg" loadingText="Sending code…">
        Email me a reset code
      </SubmitButton>
    </form>
  );
}
