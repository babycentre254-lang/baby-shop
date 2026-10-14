"use client";

import Link from "next/link";
import Image from "next/image";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Brand } from "@baby-shop/shared";

interface Props {
  brands: Brand[];
  activeBrand: string;
}

export function BrandShowcase({ brands, activeBrand }: Props) {
  if (brands.length === 0) return null;

  return (
    <section aria-label="Shop by brand" className="mb-3 rounded-xl border border-cream-200 bg-white px-2 py-2 shadow-sm">
      <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        Shop by brand
      </div>
      <div
        className="flex gap-1.5 overflow-x-auto scrollbar-hide px-1 pb-0.5"
        style={{ scrollbarWidth: "none" }}
      >
        <Link
          href="/products"
          className={cn(
            "shrink-0 h-9 px-3 rounded-lg border flex items-center gap-2 transition-all",
            !activeBrand
              ? "bg-blue-500 border-blue-500 text-white shadow-sm"
              : "bg-white border-cream-200 text-ink-700 hover:border-blue-300"
          )}
        >
          <Award className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold whitespace-nowrap">
            All brands
          </span>
        </Link>

        {brands.map((b) => {
          const active = activeBrand === b.slug;
          const logo = (b as any).logoUrl;
          return (
            <Link
              key={b._id}
              href={`/products?brand=${b.slug}`}
              className={cn(
                "shrink-0 h-9 pl-1.5 pr-3 rounded-lg border flex items-center gap-2 transition-all",
                active
                  ? "bg-blue-50 border-blue-400"
                  : "bg-white border-cream-200 hover:border-blue-300"
              )}
            >
              <div className="h-7 w-7 rounded-md bg-cream-50 border border-cream-200 overflow-hidden relative flex items-center justify-center shrink-0">
                {logo ? (
                  <Image
                    src={logo}
                    alt={b.name}
                    fill
                    sizes="28px"
                    className="object-contain p-0.5"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-ink-400">
                    {b.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium truncate max-w-[90px]",
                  active ? "text-blue-700" : "text-ink-700"
                )}
              >
                {b.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
