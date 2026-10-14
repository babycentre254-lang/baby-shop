import { notFound } from "next/navigation";
import { brandsServerApi } from "@/lib/api/endpoints.server";
import { PageHeader } from "@/components/dashboard/page-header";
import { BrandForm } from "../../brand-form";
import type { Brand } from "@baby-shop/shared";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Edit Brand" };

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("brands.manage");
  const { id } = await params;

  let brand: Brand | null = null;
  try {
    const res = await brandsServerApi.get(id);
    brand = res.brand;
  } catch {
    notFound();
  }

  if (!brand) notFound();

  return (
    <div>
      <PageHeader
        title="Edit brand"
        subtitle={`Editing "${brand.name}"`}
      />
      <BrandForm mode="edit" brand={brand} />
    </div>
  );
}
