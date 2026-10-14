import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Admin Sign in" };

export default function AdminLoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-800 via-ink-900 to-ink-950 p-4 sm:p-8">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur border border-white/10 px-5 py-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
              B
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">BabyCentre</p>
              <p className="text-white/50 text-xs">Admin Dashboard</p>
            </div>
          </div>
          <h1 className="font-bold text-3xl text-white">Welcome back</h1>
          <p className="text-white/60 text-sm mt-2">
            Sign in to manage your store
          </p>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_100px_-35px_rgba(0,0,0,.65)] sm:p-9">
          <Suspense fallback={<div className="h-64 animate-pulse" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Secure workspace for BabyCentre store administrators.
        </p>
      </div>
    </div>
  );
}
