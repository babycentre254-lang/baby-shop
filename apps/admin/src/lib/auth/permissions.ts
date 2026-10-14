import { hasPermission, type AdminPermission } from "@baby-shop/shared";
import type { SessionUser } from "./session";

export function hasAdminPermission(user: SessionUser, permission: AdminPermission): boolean {
  return user.role === "SUPER_ADMIN" || hasPermission(user.permissions, permission);
}

export function permissionForAdminPath(pathname: string): AdminPermission | null {
  if (pathname === "/dashboard") return "dashboard.view";
  if (pathname.startsWith("/dashboard/analytics")) return "dashboard.view";
  if (pathname.startsWith("/dashboard/products/new") || /\/dashboard\/products\/[^/]+\/edit/.test(pathname)) return "products.manage";
  if (pathname.startsWith("/dashboard/products")) return "products.view";
  if (pathname.startsWith("/dashboard/inventory")) return "inventory.view";
  if (pathname.startsWith("/dashboard/categories/new") || /\/dashboard\/categories\/[^/]+\/edit/.test(pathname)) return "categories.manage";
  if (pathname.startsWith("/dashboard/categories")) return "categories.view";
  if (pathname.startsWith("/dashboard/brands/new") || /\/dashboard\/brands\/[^/]+\/edit/.test(pathname)) return "brands.manage";
  if (pathname.startsWith("/dashboard/brands")) return "brands.view";
  if (pathname.startsWith("/dashboard/orders/checkouts")) return "checkouts.view";
  if (pathname.startsWith("/dashboard/orders/drafts")) return "orders.manage";
  if (pathname.startsWith("/dashboard/orders")) return "orders.view";
  if (pathname.startsWith("/dashboard/customers")) return "customers.view";
  if (pathname.startsWith("/dashboard/staff")) return "staff.manage";
  if (pathname.startsWith("/dashboard/branches")) return "branches.view";
  if (pathname.startsWith("/dashboard/shipping")) return "shipping.view";
  if (pathname.startsWith("/dashboard/settings")) return "settings.view";
  return null;
}
