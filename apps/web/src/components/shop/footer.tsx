import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Camera,
  AtSign,
  Share2,
  MessageCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  CreditCard,
} from "lucide-react";

const SHOP_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/products?featured=true", label: "Featured" },
  { href: "/products?sort=-createdAt", label: "New Arrivals" },
];

const ACCOUNT_LINKS = [
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/login", label: "Sign In" },
];

const HELP_LINKS = [
  { href: "/help/shipping", label: "Shipping" },
  { href: "/help/returns", label: "Returns" },
  { href: "/help/contact", label: "Contact" },
  { href: "/help/faq", label: "FAQ" },
];

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram", icon: Camera },
  { href: "https://facebook.com", label: "Facebook", icon: Share2 },
  { href: "https://twitter.com", label: "Twitter", icon: AtSign },
  { href: "https://wa.me/254700000000", label: "WhatsApp", icon: MessageCircle },
];

const TRUST_ITEMS = [
  { icon: Truck, label: "Same-day Nairobi" },
  { icon: ShieldCheck, label: "Safe materials" },
  { icon: RotateCcw, label: "30-day returns" },
  { icon: CreditCard, label: "M-Pesa accepted" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 md:mt-24 border-t border-cream-200 bg-white">
      {/* ─── Trust strip ─── */}
      <div className="border-b border-cream-200 bg-cream-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 text-xs md:text-sm text-ink-700"
              >
                <span className="h-8 w-8 rounded-lg bg-white border border-cream-200 flex items-center justify-center text-blue-500 shrink-0">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── Main footer ─── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid gap-8 md:gap-10 grid-cols-2 md:grid-cols-12">
          {/* Brand block — full width on mobile, wider on desktop */}
          <div className="col-span-2 md:col-span-4 lg:col-span-5">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo.png"
                alt="BabyCentre Baby Shop"
                width={150}
                height={48}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-ink-500 leading-relaxed max-w-sm">
              Gentle essentials for your little one. Safe, soft, and
              thoughtfully made — delivered countrywide from Nairobi.
            </p>

            {/* Contact info */}
            <ul className="mt-5 space-y-2.5 text-sm text-ink-600">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                Nairobi, Kenya
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                <a
                  href="tel:+254700000000"
                  className="hover:text-blue-500 transition-colors"
                >
                  +254 700 000 000
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                <a
                  href="mailto:support@babycentre.co.ke"
                  className="hover:text-blue-500 transition-colors"
                >
                  support@babycentre.co.ke
                </a>
              </li>
            </ul>

            {/* Social icons */}
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-9 w-9 rounded-full bg-cream-100 hover:bg-blue-500 text-ink-600 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <FooterColumn
            title="Shop"
            links={SHOP_LINKS}
            className="md:col-span-2 lg:col-span-2"
          />
          <FooterColumn
            title="Account"
            links={ACCOUNT_LINKS}
            className="md:col-span-2 lg:col-span-2"
          />
          <FooterColumn
            title="Help"
            links={HELP_LINKS}
            className="md:col-span-2 lg:col-span-2"
          />

          {/* Newsletter (mobile: full width) */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <h4 className="text-[11px] font-semibold text-ink-500 uppercase tracking-[0.08em] mb-3">
              Stay in touch
            </h4>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full h-10 rounded-xl border border-cream-300 bg-white px-3 text-xs focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── Bottom bar ─── */}
      <div className="border-t border-cream-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
            <span>
              © {year}{" "}
              <span className="font-medium text-ink-700">
                BabyCentre Baby Shop
              </span>
              . All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <Link
                href="/terms"
                className="hover:text-blue-500 transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="hover:text-blue-500 transition-colors"
              >
                Privacy
              </Link>
              <span className="text-ink-300">·</span>
              <span className="flex items-center gap-1">
                Made in Nairobi
                <span role="img" aria-label="Kenya">
                  🇰🇪
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// FooterColumn
// ═══════════════════════════════════════════════════════════

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: { href: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="text-[11px] font-semibold text-ink-500 uppercase tracking-[0.08em] mb-3">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-ink-600 hover:text-blue-500 transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}