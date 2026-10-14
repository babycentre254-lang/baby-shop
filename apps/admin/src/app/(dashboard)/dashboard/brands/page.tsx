import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { brandsServerApi } from "@/lib/api/endpoints.server";
import { BrandsTable } from "./brands-table";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  const user = await requireAdminPermission("brands.view");
  let brands: any[] = [];
  try {
    const res = await brandsServerApi.list();
    brands = (res as any).items ?? [];
  } catch (err) {
    console.error("[brands page] failed:", err);
    brands = [];
  }

  return (
    <div>
      <PageHeader
        title="Brands"
        subtitle={`${brands.length} ${
          brands.length === 1 ? "brand" : "brands"
        } in your catalog`}
        actions={hasAdminPermission(user, "brands.manage") ? (
          <Link
            href="/dashboard/brands/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            New brand
          </Link>
        ) : undefined}
      />
      <BrandsTable initialBrands={brands} canManage={hasAdminPermission(user, "brands.manage")} />
    </div>
  );
}
