import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductRow } from "./product-row";
import type { Product } from "@baby-shop/shared";

interface Props {
  products: Product[];
}

export function TrendingNow({ products }: Props) {
  if (!products.length) return null;

  return (
    <section className="bg-white pt-5 pb-8 md:pt-8 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Compact inline header ─── */}
        <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
          <h2 className="text-[11px] font-semibold text-ink-500 uppercase tracking-[0.08em]">
            Trending now
          </h2>
          <Link
            href="/products?sort=-createdAt"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500 hover:text-blue-600 transition-colors shrink-0"
          >
            See all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <ProductRow
          products={products}
          columns={4}
          scrollOnMobile
        />
      </div>
    </section>
  );
}