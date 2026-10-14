import Link from "next/link";
import Image from "next/image";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-[calc(100vh-140px)] overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_var(--color-blue-50),_transparent_45%),linear-gradient(135deg,_#fffaf4_0%,_#fff7ec_52%,_#fff3f8_100%)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-36 h-96 w-96 rounded-full border-[48px] border-white/50" />
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 md:grid-cols-[1fr_0.92fr] md:gap-14 lg:px-8 lg:py-16">
          <aside className="relative hidden min-h-[580px] overflow-hidden rounded-[2rem] bg-blue-700 p-10 text-white shadow-2xl shadow-blue-900/15 md:flex md:flex-col md:justify-between lg:p-12">
            <div aria-hidden="true" className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-blue-500/50" />
            <div aria-hidden="true" className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full border-[52px] border-white/10" />
            <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-sm">
              <Image src="/logo.png" alt="" width={38} height={38} className="h-9 w-9 object-contain" priority />
              <span className="text-sm font-bold tracking-tight text-ink-900">BabyCentre</span>
            </Link>
            <div className="relative z-10 space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Heart className="h-7 w-7 fill-pink-200 text-pink-200" />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Thoughtfully chosen for little ones</p>
                <h2 className="max-w-md font-display text-4xl leading-tight text-white lg:text-5xl">Little needs.<br />Big smiles.</h2>
                <p className="max-w-sm text-sm leading-6 text-blue-100">A calmer way to find the gentle essentials, joyful toys, and everyday favourites your family needs.</p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2 text-xs font-medium text-white/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><ShieldCheck className="h-4 w-4" /> Secure account</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><Sparkles className="h-4 w-4" /> Parent-approved finds</span>
              </div>
            </div>
            <p className="relative z-10 text-xs text-blue-100/80">Here for every little milestone.</p>
          </aside>

          <div className="w-full max-w-[460px] mx-auto">
            <div className="rounded-[1.75rem] border border-white bg-white/95 p-6 shadow-xl shadow-ink-900/5 ring-1 ring-cream-300/70 sm:p-9">
              {children}
            </div>
          </div>
      </div>
    </div>
  );
}
