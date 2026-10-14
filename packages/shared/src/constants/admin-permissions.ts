export const ADMIN_PERMISSION_GROUPS = [
  { key: "dashboard", label: "Dashboard", permissions: [{ key: "dashboard.view", label: "View dashboard & analytics" }] },
  { key: "orders", label: "Orders", permissions: [{ key: "orders.view", label: "View orders" }, { key: "orders.manage", label: "Update order status & fulfillment" }, { key: "checkouts.view", label: "View checkout sessions" }, { key: "draft-orders.view", label: "View draft orders" }, { key: "draft-orders.manage", label: "Manage draft orders" }] },
  { key: "catalog", label: "Catalog", permissions: [{ key: "products.view", label: "View products" }, { key: "products.manage", label: "Create, edit & delete products" }, { key: "inventory.view", label: "View inventory" }, { key: "inventory.manage", label: "Adjust stock levels" }, { key: "categories.view", label: "View categories" }, { key: "categories.manage", label: "Manage categories" }, { key: "brands.view", label: "View brands" }, { key: "brands.manage", label: "Manage brands" }] },
  { key: "customers", label: "Customers", permissions: [{ key: "customers.view", label: "View customer records" }] },
  { key: "team", label: "Team", permissions: [{ key: "staff.manage", label: "Manage staff access" }] },
  { key: "operations", label: "Operations", permissions: [{ key: "branches.view", label: "View branches" }, { key: "branches.manage", label: "Manage branches" }, { key: "shipping.view", label: "View shipping zones" }, { key: "shipping.manage", label: "Manage shipping zones" }] },
  { key: "settings", label: "Store settings", permissions: [{ key: "settings.view", label: "View store settings" }, { key: "settings.manage", label: "Edit store settings" }] },
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_GROUPS)[number]["permissions"][number]["key"];
export const ADMIN_PERMISSIONS = ADMIN_PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.key)) as AdminPermission[];
export const ADMIN_PERMISSION_SET = new Set<string>(ADMIN_PERMISSIONS);
export const ALL_ADMIN_PERMISSIONS = ADMIN_PERMISSIONS;

export function hasPermission(permissions: readonly string[], required: string): boolean {
  if (permissions.includes(required)) return true;
  if (required.endsWith(".view")) {
    return permissions.includes(`${required.slice(0, -5)}.manage`);
  }
  return false;
}
