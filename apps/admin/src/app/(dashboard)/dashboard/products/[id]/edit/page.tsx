import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  productsServerApi,
  categoriesServerApi,
  brandsServerApi,
} from "@/lib/api/endpoints.server";
import { ProductForm } from "../../product-form";
import type { Product } from "@baby-shop/shared";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("products.manage");
  const { id } = await params;

  let product: Product | null = null;
  let categories: any[] = [];
  let brands: any[] = [];

  try {
    const [p, c, b] = await Promise.all([
      productsServerApi.get(id).catch(() => null),
      categoriesServerApi.list().catch(() => ({ items: [] })),
      brandsServerApi.list().catch(() => ({ items: [] })),
    ]);
    if (!p) notFound();
    product = p.product;
    categories = (c as any).items ?? [];
    brands = (b as any).items ?? [];
  } catch {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Edit product"
        subtitle={`Editing "${product!.name}"`}
      />
      <ProductForm
        mode="edit"
        product={product!}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
