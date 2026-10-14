"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import Link from "next/link";

import { adminLoginAction, type ActionState } from "../actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidate = searchParams.get("next");
  const next = candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/dashboard";

  const [state, formAction] = useActionState<ActionState | undefined, FormData>(
    adminLoginAction,
    undefined
  );

  useEffect(() => {
    if (state?.success) {
      router.push(next);
      router.refresh();
    }
  }, [state, router, next]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-0.5">Access denied</p>
            <p>{state.error.message}</p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-ink-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="admin@babycentre.co.ke"
          required
          autoComplete="email"
          className="w-full h-12 rounded-xl border border-ink-200 bg-ink-50/50 px-4 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-ink-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="w-full h-12 rounded-xl border border-ink-200 bg-ink-50/50 px-4 text-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-500"><input type="checkbox" name="rememberMe" defaultChecked className="h-4 w-4 rounded border-ink-300 text-blue-600 focus:ring-blue-500" />Keep me signed in</label>
        <Link href="/forgot-password" className="text-sm font-semibold text-blue-700 hover:text-blue-800">Forgot password?</Link>
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing in…
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          Sign in
        </>
      )}
    </button>
  );
}
