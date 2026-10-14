import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { User as UserIcon } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { catalogServerApi } from "@/lib/api/endpoints.server";

import { TopBar } from "./top-bar";
import { SearchBar } from "./search-bar";
import { MobileSearch } from "./mobile-search";
import { CartIcon } from "./cart-icon";
import { WishlistIcon } from "./wishlist-icon";
import { AccountMenu } from "./account-menu";
import { CategoriesNav } from "./categories-nav";
import { AllCategoriesButton } from "./all-categories-button";
import { MobileMenu } from "./mobile-menu";

interface HeaderCategory {
  _id: string;
  name: string;
  slug: string;
}

async function fetchCategories(): Promise<HeaderCategory[]> {
  try {
    const res = await catalogServerApi.listCategories();
    const items = ((res as any).items ?? []) as HeaderCategory[];
    return items;
  } catch (err) {
    unstable_rethrow(err);
    console.error("[Header] categories fetch failed:", err);
    return [];
  }
}

export async function Header() {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    fetchCategories(),
  ]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      {/* ─── Layer 1: announcement bar ─── */}
      <TopBar />

      {/* ─── Layer 2: logo + search + icons ─── */}
      <div className="border-b border-cream-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 md:h-20 items-center gap-2 md:gap-6">
            {/* Mobile hamburger */}
            <MobileMenu categories={categories} isAuthenticated={!!user} />

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="BabyCentre home"
            >
              <Image
                src="/logo.png"
                alt="BabyCentre Baby Shop"
                width={180}
                height={56}
                priority
                className="h-9 md:h-14 w-auto object-contain"
              />
            </Link>

            {/* Desktop search */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
              <Suspense
                fallback={
                  <div className="h-12 w-full rounded-full bg-cream-200" />
                }
              >
                <SearchBar />
              </Suspense>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-0 ml-auto">
              <div className="md:hidden">
                <Suspense fallback={null}>
                  <MobileSearch />
                </Suspense>
              </div>

              <WishlistIcon isAuthenticated={!!user} />
              <CartIcon isAuthenticated={!!user} />

              {user ? (
                <AccountMenu user={user} />
              ) : (
                <Link
                  href="/login"
                  aria-label="Sign in"
                  className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-ink-700 hover:text-blue-500 transition-colors"
                >
                  <div className="h-6 w-6 md:h-7 md:w-7 rounded-full bg-cream-200 flex items-center justify-center">
                    <UserIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                  <span className="hidden md:block text-[11px] font-medium">
                    Account
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Layer 3: category nav (desktop only) ─── */}
      <div className="hidden md:block border-b border-cream-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <AllCategoriesButton categories={categories} />
            <CategoriesNav categories={categories} />
          </div>
        </div>
      </div>
    </header>
  );
}
