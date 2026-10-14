import { Suspense } from "react";
import { catalogServerApi } from "@/lib/api/endpoints.server";
import { ProductsClient } from "./products-client";
import type { Product, Category, Brand } from "@baby-shop/shared";
import type { FilterValues } from "./filters-sidebar";
import type { SortValue } from "./sort-dropdown";

export const metadata = {
  title: "Shop All",
  description: "Browse our full collection of baby products",
};

interface Props {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    ageRange?: string;
    inStock?: string;
    sort?: string;
    page?: string;
    search?: string;
    featured?: string;
  }>;
}

function sortToParam(sort: SortValue): string {
  switch (sort) {
    case "newest":
      return "-createdAt";
    case "price-asc":
      return "basePrice";
    case "price-desc":
      return "-basePrice";
    case "name-asc":
      return "name";
    case "name-desc":
      return "-name";
  }
}

function mapSortFromUrl(raw?: string): SortValue {
  switch (raw) {
    case "price-asc":
    case "price-desc":
    case "name-asc":
    case "name-desc":
      return raw;
    default:
      return "newest";
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 12;
  const sort = mapSortFromUrl(params.sort);

  const filters: FilterValues = {
    category: params.category ?? "",
    brand: params.brand ?? "",
    minPrice: params.minPrice ? Number(params.minPrice) : null,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : null,
    ageRange: params.ageRange ?? "",
    inStock: params.inStock === "true",
  };

  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    catalogServerApi
      .listProducts({
        page,
        pageSize,
        categorySlug: filters.category || undefined,
        brandSlug: filters.brand || undefined,
        minPrice: filters.minPrice ?? undefined,
        maxPrice: filters.maxPrice ?? undefined,
        ageRange: filters.ageRange || undefined,
        search: params.search || undefined,
        featured: params.featured === "true" ? true : undefined,
        sort: sortToParam(sort),
      })
      .catch((err) => {
        console.error("[products page] fetch failed:", err);
        return { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 };
      }),
    catalogServerApi
      .listCategories()
      .catch(() => ({ items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 })),
    catalogServerApi
      .listBrands()
      .catch(() => ({ items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 })),
  ]);

  let products = (productsRes as any).items ?? [];
  const total = (productsRes as any).total ?? 0;
  const totalPages = (productsRes as any).totalPages ?? 1;

  // Client-side in-stock filter
  if (filters.inStock) {
    products = products.filter((p: any) => {
      const vs = p.variants ?? [];
      return vs.length === 0 || vs.some((v: any) => v.stock > 0);
    });
  }

  return (
    <Suspense fallback={null}>
      <ProductsClient
        products={products as Product[]}
        total={total}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        categories={(categoriesRes as any).items ?? []}
        brands={(brandsRes as any).items ?? []}
        initialFilters={filters}
        initialSort={sort}
      />
    </Suspense>
  );
}
