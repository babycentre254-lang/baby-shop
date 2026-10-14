import { notFound } from "next/navigation";
import { productsServerApi } from "@/lib/api/endpoints.server";
import type { Product } from "@baby-shop/shared";
import { ProductDetail } from "./product-detail";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Product Details" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("products.view");
  const { id } = await params;

  let product: Product | null = null;

  try {
    const res = await productsServerApi.get(id);
    product = res.product;
  } catch (err) {
    console.error("[product detail] fetch failed:", err);
    notFound();
  }

  if (!product) notFound();

  return <ProductDetail product={product} />;
}
