import { Users, BadgeCheck, UserRoundPlus, MailCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { adminServerApi } from "@/lib/api/endpoints.server";
import type { CustomerStats } from "@/lib/api/endpoints";
import { requireAdminPermission } from "@/lib/auth/session";
import { CustomersTable } from "./table";

export const metadata = { title: "Customers" };

const emptyStats: CustomerStats = { total: 0, verified: 0, unverified: 0, newLast30Days: 0 };

export default async function CustomersPage() {
  await requireAdminPermission("customers.view");
  let result;
  let unavailable = false;
  try {
    result = await adminServerApi.customers({ page: 1, pageSize: 20 });
  } catch {
    unavailable = true;
    result = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0, stats: emptyStats };
  }

  const stats = result.stats ?? emptyStats;
  const cards = [
    { label: "Registered customers", value: stats.total, note: "Matching your current view", icon: Users, tone: "bg-blue-50 text-blue-600" },
    { label: "Verified emails", value: stats.verified, note: "Accounts confirmed by email", icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Unverified", value: stats.unverified, note: "May need a verification reminder", icon: MailCheck, tone: "bg-amber-50 text-amber-600" },
    { label: "Joined in 30 days", value: stats.newLast30Days, note: "Recent customer signups", icon: UserRoundPlus, tone: "bg-violet-50 text-violet-600" },
  ];

  return (
    <>
      <PageHeader title="Customers" subtitle="Understand your customer base and quickly find account and order history." />
      {unavailable && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Customer data is temporarily unavailable. Refresh the page to try again.</div>}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className="rounded-2xl border border-cream-300 bg-white p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-ink-500">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-ink-900">{value.toLocaleString()}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={19}/></span></div>
            <p className="mt-3 text-xs text-ink-400">{note}</p>
          </article>
        ))}
      </div>
      <CustomersTable initialCustomers={result.items ?? []} initialTotal={result.total ?? 0} initialPage={result.page ?? 1} initialPageSize={result.pageSize ?? 20} initialStats={stats} />
    </>
  );
}
