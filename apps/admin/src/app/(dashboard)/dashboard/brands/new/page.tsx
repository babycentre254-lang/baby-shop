import { PageHeader } from "@/components/dashboard/page-header";
import { BrandForm } from "../brand-form";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "New Brand" };

export default async function NewBrandPage() {
  await requireAdminPermission("brands.manage");
  return (
    <div>
      <PageHeader
        title="New brand"
        subtitle="Add a brand to your catalog"
      />
      <BrandForm mode="create" />
    </div>
  );
}
