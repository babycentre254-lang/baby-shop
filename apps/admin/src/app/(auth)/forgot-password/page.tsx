import { Suspense } from "react";
import { AdminForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Reset admin password | BabyCentre" };

export default function AdminForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(0,144,216,.28),transparent_42%),radial-gradient(ellipse_at_90%_85%,rgba(240,65,126,.13),transparent_35%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-[0_36px_120px_-35px_rgba(0,0,0,.75)] lg:grid-cols-[.88fr_1.12fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-ink-900 p-10 text-white lg:flex">
          <div aria-hidden="true" className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-12 top-32 h-48 w-48 rounded-full border border-white/10" />
          <div className="relative">
            <Brand light />
            <div className="mt-20 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-blue-100 shadow-lg shadow-black/10">
              <span className="text-2xl" aria-hidden="true">✳</span>
            </div>
            <h2 className="mt-7 max-w-xs text-3xl font-semibold leading-tight tracking-tight">A secure way back into your workspace.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/75">We’ll verify your admin email before changing the password on your account.</p>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-blue-100/55"><span className="h-2 w-2 rounded-full bg-emerald-400" />Protected account recovery</div>
        </aside>

        <section className="px-6 py-8 sm:px-10 sm:py-11 lg:px-12">
          <div className="mb-9 lg:hidden"><Brand /></div>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Admin account</p>
            <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-ink-900 sm:text-3xl">Reset your password</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">Get a secure one-time code by email, then choose a new password.</p>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-ink-50" />}>
            <AdminForgotPasswordForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-950/20">B</div>
    <div><p className={`text-sm font-bold ${light ? "text-white" : "text-ink-900"}`}>BabyCentre</p><p className={`text-xs ${light ? "text-blue-100/60" : "text-ink-500"}`}>Admin workspace</p></div>
  </div>;
}
