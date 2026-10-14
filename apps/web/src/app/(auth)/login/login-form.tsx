"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { loginAction, type ActionState } from "../actions";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { Alert } from "@/components/forms/alert";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidate = searchParams.get("next");
  const next = candidate?.startsWith("/") && !candidate.startsWith("//")
    ? candidate
    : "/account/orders";

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    loginAction,
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      router.push(next);
      router.refresh();
    }
  }, [state, router, next]);

  useEffect(() => {
    if (state?.error?.code === "EMAIL_NOT_VERIFIED" && state.email) {
      const params = new URLSearchParams({ email: state.email, next });
      router.replace(`/verify-email?${params.toString()}`);
    }
  }, [state, router, next]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && !state.error.details && (
        <div className="space-y-3"><Alert variant="error">{state.error.message}</Alert>
        </div>
      )}

      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        required
        autoComplete="email"
        errors={state?.error?.details?.email}
      />

      <PasswordInput
        label="Password"
        name="password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
        errors={state?.error?.details?.password}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
          <input
            type="checkbox"
            name="rememberMe"
            defaultChecked
            className="h-4 w-4 rounded border-ink-300 text-blue-500 focus:ring-blue-400"
          />
          Keep me signed in
        </label>
        <Link
          href="/forgot-password"
          className="text-sm text-blue-500 hover:text-blue-600 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <SubmitButton className="w-full" size="lg" loadingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
