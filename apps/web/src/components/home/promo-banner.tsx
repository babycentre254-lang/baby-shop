"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Star } from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import type { Product, Category } from "@baby-shop/shared";

interface Props {
  products: Product[];
  categories?: Category[];
}

// ═══════════════════════════════════════════════════════════
// Helpers — dedupe + stable shuffle
// ═══════════════════════════════════════════════════════════

/** Remove duplicates by _id, keeping the first occurrence */
function dedupeById<T extends { _id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?._id || seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

/**
 * Deterministic shuffle — same seed always produces the same order.
 * Makes the picks stable across re-renders and refreshes within a session.
 */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    // Mulberry32-ish PRNG
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = Math.floor((s / 4294967296) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Derive the same seed on the server and browser to keep SSR hydration stable. */
function getProductSeed(items: Product[]): number {
  return items.reduce((seed, item) => {
    for (const char of item._id) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
    return seed;
  }, 2166136261);
}

// ═══════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════

export function PromoBanner({ products, categories = [] }: Props) {
  // Dedupe ONCE, before memoization — cheap and idempotent
  const uniqueProducts = useMemo(() => dedupeById(products), [products]);
  const uniqueCategories = useMemo(() => dedupeById(categories), [categories]);

  // Catalog-derived seed is deterministic during server render and hydration.
  const picks = useMemo(() => {
    if (uniqueProducts.length === 0) return [];
    const seed = getProductSeed(uniqueProducts);
    return seededShuffle(uniqueProducts, seed).slice(0, 3);
  }, [uniqueProducts]);

  if (picks.length === 0) return null;

  return (
    <section className="border-t border-cream-100 bg-white py-5 md:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Section label ─── */}
        <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
          <h2 className="text-[11px] font-semibold text-ink-500 uppercase tracking-[0.08em]">
            Handpicked for you
          </h2>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-600 transition-colors shrink-0"
          >
            Shop all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* ─── Gradient card ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 via-blue-600 to-pink-500 p-1">
          <div className="relative rounded-[22px] bg-white/5 backdrop-blur-sm px-3 py-4 sm:px-5 md:px-6 md:py-5">
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full border-4 border-white/10" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full border-4 border-white/10" />

            <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
              {/* ─── Left: copy ─── */}
              <div className="text-white space-y-2.5 lg:max-w-xs shrink-0 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[11px] font-semibold">
                  <Sparkles className="h-3 w-3" />
                  The BabyCentre edit
                </div>
                <h3 className="font-display text-lg leading-tight sm:text-xl">
                  Fresh picks from our shelves
                </h3>
                <p className="text-xs md:text-sm text-white/85 max-w-md mx-auto lg:mx-0">
                  A rotating selection from our catalog — safe, soft, and
                  thoughtfully made.
                </p>
              </div>

              {/* ─── Right: product tiles ─── */}
              <div className="flex-1 grid grid-cols-3 gap-2 md:gap-3 min-w-0">
                {picks.map((p, idx) => (
                  <PromoProductTile key={`${p._id}-${idx}`} product={p} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Category chips (optional) ─── */}
        {uniqueCategories.length > 0 && (
          <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
            {uniqueCategories.slice(0, 8).map((cat) => (
              <Link
                key={cat._id}
                href={`/products?category=${cat.slug}`}
                className={cn(
                  "shrink-0 h-8 px-3 rounded-full",
                  "bg-cream-100 hover:bg-cream-200 border border-cream-200",
                  "text-xs font-medium text-ink-700 hover:text-blue-600",
                  "inline-flex items-center gap-1.5 transition-colors"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Promo product tile
// ═══════════════════════════════════════════════════════════

function PromoProductTile({ product }: { product: Product }) {
  const image = (product as any).images?.[0]?.url;
  const alt = (product as any).images?.[0]?.altText || product.name;
  const salePrice = (product as any).salePrice;
  const basePrice = product.basePrice;
  const price = salePrice ?? basePrice;
  const hasSale = salePrice != null && salePrice < basePrice;
  const discountPct = hasSale
    ? Math.round(((basePrice - salePrice) / basePrice) * 100)
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group rounded-2xl overflow-hidden",
        "bg-white/95 hover:bg-white backdrop-blur-sm",
        "border border-white/30 hover:border-white/50",
        "transition-all hover:-translate-y-0.5 hover:shadow-lg",
        "flex flex-col"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square bg-cream-50 overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 640px) 30vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-cream-400">
            <span className="text-3xl font-display">B</span>
          </div>
        )}

        {hasSale && discountPct > 0 && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center rounded-md bg-pink-500 text-white text-[10px] font-bold px-1.5 py-0.5 shadow-sm">
            -{discountPct}%
          </span>
        )}

        {(product as any).isFeatured && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center h-5 w-5 rounded-md bg-yellow-400 text-white shadow-sm">
            <Star className="h-3 w-3 fill-white" />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2 md:p-2.5 flex flex-col gap-1">
        <p className="text-[11px] md:text-xs font-medium text-ink-900 line-clamp-2 leading-tight">
          {product.name}
        </p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-xs md:text-sm font-semibold text-ink-900">
            {formatKES(price)}
          </span>
          {hasSale && (
            <span className="text-[10px] text-ink-400 line-through">
              {formatKES(basePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
