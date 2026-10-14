import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Your family’s favourites await</p>
        <h1 className="font-display text-3xl text-ink-900">Welcome back</h1>
        <p className="text-sm text-ink-500">Sign in to continue shopping</p>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse" />}>
        <LoginForm />
      </Suspense>

      <div className="text-center text-sm text-ink-500">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-500 hover:text-blue-600 hover:underline"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
