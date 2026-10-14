import "server-only";

import { authServerApi } from "../api/endpoints.server";
import type { AdminPermission } from "@baby-shop/shared";
import { redirect } from "next/navigation";
import { hasPermission } from "@baby-shop/shared";

export interface SessionUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  permissions: AdminPermission[];
}

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const res = await authServerApi.me();
    const user = res.user as SessionUser;
    if (!ADMIN_ROLES.includes(user.role)) return null;
    user.permissions = user.permissions ?? [];
    return user;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdminPermission(permission: AdminPermission): Promise<SessionUser> {
  const user = await requireAdmin();
  if (user.role !== "SUPER_ADMIN" && !hasPermission(user.permissions, permission)) {
    const options: [AdminPermission, string][] = [
      ["dashboard.view", "/dashboard"], ["orders.view", "/dashboard/orders"], ["orders.manage", "/dashboard/orders/drafts"],
      ["products.view", "/dashboard/products"], ["products.manage", "/dashboard/products"], ["inventory.view", "/dashboard/inventory"],
      ["inventory.manage", "/dashboard/inventory"], ["categories.view", "/dashboard/categories"], ["categories.manage", "/dashboard/categories"],
      ["brands.view", "/dashboard/brands"], ["brands.manage", "/dashboard/brands"], ["customers.view", "/dashboard/customers"],
      ["branches.view", "/dashboard/branches"], ["branches.manage", "/dashboard/branches"], ["shipping.view", "/dashboard/shipping"],
      ["shipping.manage", "/dashboard/shipping"], ["settings.view", "/dashboard/settings"], ["settings.manage", "/dashboard/settings"],
    ];
    const fallback = options.find(([required]) => hasPermission(user.permissions ?? [], required))?.[1] ?? "/dashboard/access-denied";
    redirect(fallback);
  }
  return user;
}
