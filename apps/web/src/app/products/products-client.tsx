"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import {
  SlidersHorizontal,
  X,
  Home,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { FiltersSidebar, type FilterValues } from "./filters-sidebar";
import { SortDropdown, type SortValue } from "./sort-dropdown";
import { ActiveFilters } from "./active-filters";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { BrandShowcase } from "./brand-showcase";
import { Button } from "@/components/ui/button";
import type { Product, Category, Brand } from "@baby-shop/shared";

interface Props {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  categories: Category[];
  brands: Brand[];
  initialFilters: FilterValues;
  initialSort: SortValue;
}

export function ProductsClient({
  products,
  total,
  page,
  totalPages,
  pageSize,
  categories,
  brands,
  initialFilters,
  initialSort,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = initialFilters;
  const sort = initialSort;

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      if (!("page" in patch)) params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleFiltersChange = (patch: Partial<FilterValues>) => {
    const update: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" || v === false) update[k] = null;
      else update[k] = String(v);
    }
    updateParams(update);
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const handleSort = (v: SortValue) => {
    updateParams({ sort: v });
  };

  const handlePage = (p: number) => {
    updateParams({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount = [
    filters.category,
    filters.brand,
    filters.minPrice || filters.maxPrice,
    filters.ageRange,
    filters.inStock,
  ].filter(Boolean).length;

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const activeBrand = brands.find((b) => b.slug === filters.brand);

  const pageTitle = activeCategory?.name ?? activeBrand?.name ?? "All products";

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        {/* ═══ Compact bar: breadcrumb + count · sort ═══ */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-xs text-ink-500"
          >
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-blue-600"
            >
              <Home className="h-3.5 w-3.5" /> Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300" />
            <span className="text-ink-800 truncate">
              {pageTitle}
            </span>
          </nav>

        </div>

        {/* Keep the brand showcase above the catalog. */}
        {brands.length > 0 && (
          <BrandShowcase brands={brands} activeBrand={filters.brand} />
        )}

        {/* ═══ Mobile toolbar ═══ */}
        <div className="mb-3 flex items-center gap-2 md:hidden">
          <Button
            variant="outline"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex-1 h-10"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <SortDropdown value={sort} onChange={handleSort} />
        </div>

        {/* ═══ Grid ═══ */}
        <div className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="hidden border-r border-cream-200 md:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-4">
                <FiltersSidebar
                  categories={categories}
                  brands={brands}
                  values={filters}
                  onChange={handleFiltersChange}
                  onClear={clearFilters}
                />
              </div>
            </aside>

            <section className="min-w-0">
              <div className="flex min-h-[60px] items-center justify-between gap-4 border-b border-cream-200 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <h1 className="truncate text-base font-semibold text-ink-900 sm:text-lg">
                    {pageTitle}
                  </h1>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {total.toLocaleString("en-KE")} {total === 1 ? "product" : "products"} found
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-2 md:flex">
                  <span className="text-xs text-ink-500">Sort by:</span>
                  <SortDropdown value={sort} onChange={handleSort} />
                </div>
              </div>

              <div className="px-3 py-3 sm:px-4 sm:py-4">
                <ActiveFilters
                  values={filters}
                  categories={categories}
                  brands={brands}
                  onChange={handleFiltersChange}
                />

                {products.length === 0 ? (
                  <EmptyState onClear={clearFilters} />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-7">
                      {products.map((p, i) => (
                        <ProductCard
                          key={p._id}
                          product={p as any}
                          priority={i < 4}
                        />
                      ))}
                    </div>

                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={handlePage}
                    />
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink-900/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-cream-200">
              <span className="font-semibold text-ink-900">Filters</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-cream-100 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FiltersSidebar
                categories={categories}
                brands={brands}
                values={filters}
                onChange={(patch) => {
                  handleFiltersChange(patch);
                  setMobileFiltersOpen(false);
                }}
                onClear={() => {
                  clearFilters();
                  setMobileFiltersOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
