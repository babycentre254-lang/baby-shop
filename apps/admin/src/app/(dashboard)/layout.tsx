import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { PermissionBoundary } from "@/components/dashboard/permission-boundary";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-cream-100">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <PermissionBoundary user={user}>{children}</PermissionBoundary>
        </main>
      </div>
    </div>
  );
}
