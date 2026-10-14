import Link from "next/link";
import { ArrowRight, HeartHandshake, MessageCircle, ShieldCheck } from "lucide-react";

export function NewsletterCTA() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 md:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink-900 px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-12">
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[42px] border-white/5" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-sage-500/10 blur-2xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sage-200">
                <HeartHandshake className="h-4 w-4" /> Here for your family
              </span>
              <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Good care starts with the little things.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Browse considered essentials for feeding, play, rest, and all the moments in between.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href="/products?sort=-createdAt" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sage-300 px-5 text-sm font-semibold text-ink-900 transition hover:-translate-y-0.5 hover:bg-sage-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-sage-300/50">
                Explore new arrivals <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="mailto:support@babycentre.co.ke" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
                <MessageCircle className="h-4 w-4" /> Ask us for help
              </a>
            </div>
          </div>
          <div className="relative mt-7 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/60">
            <ShieldCheck className="h-4 w-4 text-sage-300" /> Thoughtful products, friendly support, delivery across Kenya.
          </div>
        </div>
      </div>
    </section>
  );
}
