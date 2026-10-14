"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface Props {
  categories: { _id: string; name: string; slug: string }[];
  isAuthenticated: boolean;
}

export function MobileMenu({ categories, isAuthenticated }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 text-ink-700"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-cream-200">
              <span className="font-display text-lg text-ink-900">Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <MobileLink href="/" onClick={() => setOpen(false)}>
                Home
              </MobileLink>

              <div className="pt-4 pb-2 text-xs font-semibold text-ink-400 uppercase tracking-wider">
                Categories
              </div>
              {categories.map((c) => (
                <MobileLink
                  key={c._id}
                  href={`/products?category=${c.slug}`}
                  onClick={() => setOpen(false)}
                >
                  {c.name}
                </MobileLink>
              ))}
              <MobileLink href="/products" onClick={() => setOpen(false)}>
                Shop All
              </MobileLink>

              <div className="pt-4 pb-2 text-xs font-semibold text-ink-400 uppercase tracking-wider">
                Account
              </div>
              {isAuthenticated ? (
                <>
                  <MobileLink href="/account/orders" onClick={() => setOpen(false)}>
                    My Orders
                  </MobileLink>
                  <MobileLink href="/account/addresses" onClick={() => setOpen(false)}>
                    Addresses
                  </MobileLink>
                </>
              ) : (
                <>
                  <MobileLink href="/login" onClick={() => setOpen(false)}>
                    Sign in
                  </MobileLink>
                  <MobileLink href="/register" onClick={() => setOpen(false)}>
                    Create account
                  </MobileLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 rounded-xl text-sm text-ink-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
    >
      {children}
    </Link>
  );
}
