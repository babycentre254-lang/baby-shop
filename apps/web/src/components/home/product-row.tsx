import { ProductCard } from "@/components/shop/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@baby-shop/shared";

interface Props {
  products: Product[];
  columns?: 2 | 3 | 4 | 5;
  priorityFirst?: boolean;
  /**
   * When true, renders as a horizontal scroller on mobile
   * (fits more products in less vertical space).
   * Grid on tablet and up regardless.
   */
  scrollOnMobile?: boolean;
}

const COL_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

export function ProductRow({
  products,
  columns = 4,
  priorityFirst = false,
  scrollOnMobile = false,
}: Props) {
  if (!products.length) return null;

  // ─── Mobile: horizontal scroll ───
  if (scrollOnMobile) {
    return (
      <>
        {/* Mobile */}
        <div className="sm:hidden">
          <div className="-mx-4 flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1 snap-x snap-mandatory">
            {products.map((p, i) => (
              <div
                key={p._id}
                className="w-[160px] shrink-0 snap-start"
              >
                <ProductCard
                  product={p as any}
                  priority={priorityFirst && i < 2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Tablet and up */}
        <div
          className={cn(
            "hidden sm:grid gap-3 md:gap-4",
            COL_CLASS[columns]
          )}
        >
          {products.map((p, i) => (
            <ProductCard
              key={p._id}
              product={p as any}
              priority={priorityFirst && i < 2}
            />
          ))}
        </div>
      </>
    );
  }

  // ─── Grid everywhere ───
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4 lg:gap-5",
        COL_CLASS[columns]
      )}
    >
      {products.map((p, i) => (
        <ProductCard
          key={p._id}
          product={p as any}
          priority={priorityFirst && i < 2}
        />
      ))}
    </div>
  );
}