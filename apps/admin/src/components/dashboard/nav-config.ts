import {
  LayoutDashboard,
  Package,
  Plus,
  Boxes,
  Tags,
  Award,
  ShoppingCart,
  ClipboardList,
  CreditCard,
  Users,
  UserCog,
  Settings,
  Store,
  Truck,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import type { AdminPermission } from "@baby-shop/shared";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "orders" | "lowStock";
  exact?: boolean;
  permission?: AdminPermission;
}

export interface NavSection {
  id: string;
  label?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true, permission: "dashboard.view" },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, permission: "dashboard.view" },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { href: "/dashboard/products", label: "All Products", icon: Package, permission: "products.view" },
      { href: "/dashboard/products/new", label: "Create Product", icon: Plus, exact: true, permission: "products.manage" },
      { href: "/dashboard/inventory", label: "Inventory", icon: Boxes, badge: "lowStock", permission: "inventory.view" },
      { href: "/dashboard/categories", label: "Categories", icon: Tags, permission: "categories.view" },
      { href: "/dashboard/brands", label: "Brands", icon: Award, permission: "brands.view" },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, badge: "orders", permission: "orders.view" },
      { href: "/dashboard/orders/checkouts", label: "Checkout sessions", icon: CreditCard, permission: "checkouts.view" },
      { href: "/dashboard/orders/drafts", label: "New Sale", icon: ClipboardList, permission: "orders.manage" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    items: [
      { href: "/dashboard/customers", label: "All Customers", icon: Users, permission: "customers.view" },
      { href: "/dashboard/staff", label: "Staff & Roles", icon: UserCog, permission: "staff.manage" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { href: "/dashboard/branches", label: "Branches", icon: Store, permission: "branches.view" },
      { href: "/dashboard/shipping", label: "Shipping", icon: Truck, permission: "shipping.view" },
    ],
  },
  {
    id: "system",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings, permission: "settings.view" },
    ],
  },
];
