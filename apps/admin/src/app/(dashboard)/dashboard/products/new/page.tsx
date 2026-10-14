import { PageHeader } from "@/components/dashboard/page-header";
import { requireAdminPermission } from "@/lib/auth/session";
import { ProductForm } from "../product-form";
import {
  categoriesServerApi,
  brandsServerApi,
} from "@/lib/api/endpoints.server";

export const metadata = { title: "New Product" };

export default async function NewProductPage() {
  await requireAdminPermission("products.manage");
  let categories: any[] = [];
  let brands: any[] = [];

  try {
    const [c, b] = await Promise.all([
      categoriesServerApi.list().catch(() => ({ items: [] })),
      brandsServerApi.list().catch(() => ({ items: [] })),
    ]);
    categories = (c as any).items ?? [];
    brands = (b as any).items ?? [];
  } catch {
    /* ignore */
  }

  return (
    <div>
      <PageHeader
        title="Create product"
        subtitle="Add a new product to your catalog"
      />
      <ProductForm mode="create" categories={categories} brands={brands} />
    </div>
  );
}
