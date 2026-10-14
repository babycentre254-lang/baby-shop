import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { ProductRow } from "./product-row";
import type { Product } from "@baby-shop/shared";

export function TrendingProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;

  return (
    <section className="border-t border-cream-100 bg-white py-5 md:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-medium text-ink-500">Loved by local families</p>
              <h2 className="font-display text-lg font-semibold leading-tight text-ink-900 sm:text-xl">
                Trending now
              </h2>
            </div>
          </div>
          <Link
            href="/products"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-cream-300 px-3 text-xs font-semibold text-ink-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            Shop all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ProductRow products={products} columns={4} priorityFirst scrollOnMobile />
      </div>
    </section>
  );
}
