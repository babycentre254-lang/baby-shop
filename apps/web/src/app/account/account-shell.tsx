"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package, Settings, ShieldCheck, Sparkles } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/settings", label: "Account settings", icon: Settings },
];

export function AccountShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const initials = `${user.firstName?.[0] ?? "B"}${user.lastName?.[0] ?? ""}`.toUpperCase();
  return <div className="min-h-screen bg-[#f8f6f1]">
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10 lg:px-8">
      <div className="mb-6 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-blue-50 via-white to-sage-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-sm">{initials}</div><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Your account</p><h1 className="mt-1 truncate text-xl font-bold text-ink-900">Welcome back, {user.firstName}</h1><p className="mt-0.5 truncate text-sm text-ink-500">{user.email}</p></div></div>
          <div className="hidden items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs font-medium text-ink-600 sm:flex"><ShieldCheck size={15} className="text-sage-600"/>Your details stay private</div>
        </div>
        <nav aria-label="Account navigation" className="flex gap-1 overflow-x-auto border-t border-cream-200 p-2 sm:px-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/account/orders" && pathname.startsWith(`${href}/`)) || (href === "/account/orders" && pathname.startsWith("/account/orders/"));
            return <Link key={href} href={href} className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors", active ? "bg-blue-600 text-white shadow-sm" : "text-ink-600 hover:bg-cream-100 hover:text-ink-900")}><Icon size={16}/>{label}</Link>;
          })}
        </nav>
      </div>
      <main className="min-w-0">{children}</main>
      <div className="mt-7 flex items-center gap-2 rounded-2xl border border-cream-200 bg-white/80 px-4 py-3 text-xs text-ink-500"><Sparkles size={15} className="shrink-0 text-blue-500"/>Need help? Contact our team and include your order number for faster support.<a href="mailto:support@babycentre.co.ke" className="ml-auto shrink-0 font-semibold text-blue-700 hover:underline">Get support</a></div>
    </div>
  </div>;
}
