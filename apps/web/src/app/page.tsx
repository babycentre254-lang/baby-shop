import { HeroSection } from "@/components/home/hero-section";
import { CategoryTiles } from "@/components/home/category-tiles";
import { FeaturedProducts } from "@/components/home/featured-products";
import { TrendingProducts } from "@/components/home/trending-products";
import { PromoBanner } from "@/components/home/promo-banner";
import { NewArrivals } from "@/components/home/new-arrivals";
import { NewsletterCTA } from "@/components/home/newsletter-cta";
import { unstable_rethrow } from "next/navigation";
import { catalogServerApi, ordersServerApi } from "@/lib/api/endpoints.server";
import type { Paginated, Product, Category } from "@baby-shop/shared";

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    unstable_rethrow(err);
    console.error("[home] fetch failed:", err);
    return fallback;
  }
}

export default async function HomePage() {
  const [categoriesRes, trendingRes, featuredRes, newestRes] =
    await Promise.all([
      safeFetch<Paginated<Category>>(
        () => catalogServerApi.listCategories(),
        { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 }
      ),
      safeFetch<{ items: Product[] }>(
        () => ordersServerApi.trendingProducts(),
        { items: [] }
      ),
      safeFetch<Paginated<Product>>(
        () => catalogServerApi.listProducts({ featured: true, pageSize: 8 }),
        { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 }
      ),
      safeFetch<Paginated<Product>>(
        () =>
          catalogServerApi.listProducts({ sort: "-createdAt", pageSize: 8 }),
        { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 }
      ),
    ]);

  const categories = categoriesRes.items;
  const trending = trendingRes.items;
  const featured = featuredRes.items;
  const newest = newestRes.items;

  return (
    <>
      <HeroSection />
      <CategoryTiles categories={categories} />
      <TrendingProducts products={trending} />
      <FeaturedProducts products={featured} />
      <PromoBanner products={[...featured, ...newest]} categories={categories} />
      <NewArrivals products={newest} />
      <NewsletterCTA />
    </>
  );
}
