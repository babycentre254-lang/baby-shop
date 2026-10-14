import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  productsServerApi,
  categoriesServerApi,
  brandsServerApi,
} from "@/lib/api/endpoints.server";
import { ProductsTable } from "./products-table";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const user = await requireAdminPermission("products.view");
  console.log("[products page] starting server-side fetch...");

  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    productsServerApi.list({ pageSize: 100 }).catch((err) => {
      console.error("═══════ PRODUCTS LOAD FAILED ═══════");
      console.error("Message:", err?.message);
      console.error("Code:", err?.code);
      console.error("Status:", err?.status);
      console.error("Full:", err);
      console.error("═══════════════════════════════════");
      return { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 };
    }),
    categoriesServerApi.list().catch((err) => {
      console.error("[categories] failed:", err?.message);
      return { items: [] };
    }),
    brandsServerApi.list().catch((err) => {
      console.error("[brands] failed:", err?.message);
      return { items: [] };
    }),
  ]);

  const products = (productsRes as any).items ?? [];
  const categories = (categoriesRes as any).items ?? [];
  const brands = (brandsRes as any).items ?? [];

  console.log("[products page] loaded:", {
    products: products.length,
    categories: categories.length,
    brands: brands.length,
  });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} ${
          products.length === 1 ? "product" : "products"
        } in your catalog`}
        actions={user && hasAdminPermission(user, "products.manage") ? (
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            New product
          </Link>
        ) : undefined}
      />
      <ProductsTable
        initialProducts={products}
        categories={categories}
        brands={brands}
        canManage={!!user && hasAdminPermission(user, "products.manage")}
      />
    </div>
  );
}
