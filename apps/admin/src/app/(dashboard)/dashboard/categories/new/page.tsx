import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesServerApi } from "@/lib/api/endpoints.server";
import { CategoryForm } from "../category-form";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "New Category" };

export default async function NewCategoryPage() {
  await requireAdminPermission("categories.manage");
  let allCategories: any[] = [];
  try {
    const res = await categoriesServerApi.list();
    allCategories = (res as any).items ?? [];
  } catch {
    allCategories = [];
  }

  return (
    <div>
      <PageHeader
        title="New category"
        subtitle="Create a category to organise your products"
      />
      <CategoryForm mode="create" allCategories={allCategories} />
    </div>
  );
}
