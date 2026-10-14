import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesServerApi } from "@/lib/api/endpoints.server";
import { CategoriesTable } from "./categories-table";
import { requireAdminPermission } from "@/lib/auth/session";
import { hasAdminPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const user = await requireAdminPermission("categories.view");
  let categories: any[] = [];
  try {
    const res = await categoriesServerApi.list();
    categories = (res as any).items ?? [];
  } catch {
    categories = [];
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} ${
          categories.length === 1 ? "category" : "categories"
        } in your catalog`}
        actions={hasAdminPermission(user, "categories.manage") ? (
          <Link
            href="/dashboard/categories/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            New category
          </Link>
        ) : undefined}
      />
      <CategoriesTable initialCategories={categories} canManage={hasAdminPermission(user, "categories.manage")} />
    </div>
  );
}
