import { notFound } from "next/navigation";
import { brandsServerApi, productsServerApi } from "@/lib/api/endpoints.server";
import type { Brand, Product } from "@baby-shop/shared";
import { BrandDetail } from "./brand-detail";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Brand Details" };

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("brands.view");
  const { id } = await params;

  let brand: Brand | null = null;
  let products: Product[] = [];

  try {
    const res = await brandsServerApi.get(id);
    brand = res.brand;

    // Fetch products for this brand (both published and draft)
    const productsRes = await productsServerApi
      .list({ brandId: id, pageSize: 100 })
      .catch(() => ({ items: [] }));
    products = (productsRes as any).items ?? [];
  } catch (err) {
    console.error("[brand detail] failed:", err);
    notFound();
  }

  if (!brand) notFound();

  return <BrandDetail brand={brand} products={products} />;
}
