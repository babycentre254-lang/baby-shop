import { PageHeader } from "@/components/dashboard/page-header";
import { productsServerApi } from "@/lib/api/endpoints.server";
import { InventoryTable } from "./inventory-table";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Inventory" };

/**
 * Fetch ALL products across multiple pages.
 * The API caps pageSize at 100, so we loop until we've collected everything.
 * For shops with < 100 products this is one round-trip; for larger catalogs
 * it fans out predictably.
 */
async function fetchAllProducts(): Promise<{
  items: any[];
  total: number;
}> {
  const PAGE_SIZE = 100;
  const all: any[] = [];
  let page = 1;
  let total = 0;

  // Hard cap to prevent runaway loops
  const MAX_PAGES = 50;

  while (page <= MAX_PAGES) {
    const res = await productsServerApi.list({
      page,
      pageSize: PAGE_SIZE,
    });

    const items = (res as any).items ?? [];
    total = (res as any).total ?? 0;
    all.push(...items);

    // Stop if we've got everything, or the last page was empty
    if (all.length >= total || items.length === 0) break;
    page += 1;
  }

  return { items: all, total };
}

export default async function InventoryPage() {
  const user = await requireAdminPermission("inventory.view");
  let products: any[] = [];
  try {
    const { items } = await fetchAllProducts();
    products = items;
  } catch (err) {
    console.error("[inventory] failed to load products:", err);
    products = [];
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track and manage stock across your catalog"
      />
      <InventoryTable initialProducts={products} canManageStock={!!user && hasAdminPermission(user, "inventory.manage")} canManageProducts={!!user && hasAdminPermission(user, "products.manage")} />
    </div>
  );
}
