"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { hasAdminPermission, permissionForAdminPath } from "@/lib/auth/permissions";

export function PermissionBoundary({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const permission = permissionForAdminPath(pathname);
  const isStaffPage = pathname.startsWith("/dashboard/staff");
  if ((!isStaffPage || user.role === "SUPER_ADMIN") && (!permission || hasAdminPermission(user, permission))) return children;

  return <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100"><LockKeyhole className="h-6 w-6" /></div>
    <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-amber-700">Access restricted</p>
    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">This area isn’t assigned to your account</h1>
    <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">Your current admin role doesn’t include this section. Ask a Super Admin to update your access.</p>
    <Link href="/dashboard" className="mt-6 inline-flex h-10 items-center rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800">Back to dashboard</Link>
  </div>;
}
