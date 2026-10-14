import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductRow } from "./product-row";
import type { Product } from "@baby-shop/shared";

interface Props {
  products: Product[];
}

export function FeaturedProducts({ products }: Props) {
  if (!products.length) return null;

  return (
    <section className="border-t border-cream-100 bg-white py-5 md:py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Compact inline header ─── */}
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div>
            <p className="text-[10px] font-medium text-ink-500">Handpicked for little moments</p>
            <h2 className="mt-0.5 font-display text-lg font-semibold leading-tight text-ink-900 sm:text-xl">Featured favourites</h2>
          </div>
          <Link
            href="/products?featured=true"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-cream-300 bg-white px-3 text-xs font-semibold text-ink-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            See all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <ProductRow products={products} columns={4} priorityFirst />
      </div>
    </section>
  );
}
