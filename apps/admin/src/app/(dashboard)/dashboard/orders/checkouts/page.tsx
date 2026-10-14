import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { checkoutSessionsServerApi } from "@/lib/api/endpoints.server";
import { CheckoutSessionsList } from "./checkout-sessions-list";
import { requireAdminPermission } from "@/lib/auth/session";

export const metadata = { title: "Checkout sessions" };

export default async function CheckoutSessionsPage() {
  await requireAdminPermission("checkouts.view");
  const data = await checkoutSessionsServerApi.list().catch((error) => {
    console.error("[admin checkout sessions] failed to load:", error);
    return { items: [], total: 0 };
  });
  return <div>
    <PageHeader title="Checkout sessions" subtitle="Payment attempts and incomplete checkouts. Only completed payments become M-Pesa orders." actions={<Link href="/dashboard/orders" className="inline-flex h-10 items-center gap-2 rounded-xl border border-cream-300 bg-white px-4 text-sm font-semibold text-ink-700"><ArrowLeft className="h-4 w-4" />Back to orders</Link>} />
    <CheckoutSessionsList initialItems={data.items} total={data.total} />
  </div>;
}
