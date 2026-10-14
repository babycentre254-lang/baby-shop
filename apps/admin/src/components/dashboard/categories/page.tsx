import Link from "next/link";
import { Plus } from "lucide-react";
import { categoriesApi } from "@/lib/api/endpoints";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoriesTable } from "./categories-table";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  let categories: any[] = [];
  try {
    const res = await categoriesApi.list();
    categories = res.items ?? [];
  } catch {
    categories = [];
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} ${
          categories.length === 1 ? "category" : "categories"
        }`}
        actions={
          <Link
            href="/dashboard/categories/new"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            New category
          </Link>
        }
      />
      <CategoriesTable initialCategories={categories} />
    </div>
  );
}