import { notFound } from "next/navigation";
import { categoriesServerApi } from "@/lib/api/endpoints.server";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryForm } from "../../category-form";
import type { Category } from "@baby-shop/shared";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Edit Category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("categories.manage");
  const { id } = await params;

  let category: Category | null = null;
  let allCategories: any[] = [];

  try {
    const [c, all] = await Promise.all([
      categoriesServerApi.get(id),
      categoriesServerApi.list(),
    ]);
    category = c.category;
    allCategories = (all as any).items ?? [];
  } catch {
    notFound();
  }

  if (!category) notFound();

  return (
    <div>
      <PageHeader
        title="Edit category"
        subtitle={`Editing "${category.name}"`}
      />
      <CategoryForm
        mode="edit"
        category={category}
        allCategories={allCategories}
      />
    </div>
  );
}
