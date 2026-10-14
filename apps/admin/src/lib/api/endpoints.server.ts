import "server-only";

import { cookies } from "next/headers";
import type {
  Category,
  Brand,
  Product,
  Order,
  Paginated,
} from "@baby-shop/shared/src/types/index";
import { apiServer } from "./client";
import type { AdminAnalyticsReport, AdminPage, AdminUser, Branch, DraftOrder, StoreSettings, AdminCheckoutSession, CustomerStats } from "./endpoints";
import type { ShippingZone } from "@baby-shop/shared";

// ═══════════════════════════════════════════════════════════
// Cookie forwarding helper
// ══════════════════════════════════════════════════════

async function getServerCookieHeader(): Promise<string> {
  const store = await cookies();
  return store.toString();
}

// ═══════════════════════════════════════════════════════════
// Auth (server)
// ═══════════════════════════════════════════════════════════

export const authServerApi = {
  me: async (): Promise<{ user: any }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ user: any }>("/auth/me", { cookies: cookieHeader });
  },
};

export const adminServerApi = {
  analytics: async (days = 30) => apiServer<AdminAnalyticsReport>(`/admin/analytics?days=${days}`, { cookies: await getServerCookieHeader() }),
  customers: async (params?: { page?: number; pageSize?: number; search?: string; verified?: boolean }) => {
    const query = new URLSearchParams(Object.entries(params ?? { page: 1, pageSize: 20 }).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
    return apiServer<AdminPage<AdminUser> & { stats: CustomerStats }>(`/admin/customers?${query}`, { cookies: await getServerCookieHeader() });
  },
  staff: async () => apiServer<AdminPage<AdminUser>>("/admin/staff?page=1&pageSize=100", { cookies: await getServerCookieHeader() }),
  branches: async () => apiServer<{ branches: Branch[] }>("/admin/branches", { cookies: await getServerCookieHeader() }),
  settings: async () => apiServer<{ settings: StoreSettings }>("/admin/settings", { cookies: await getServerCookieHeader() }),
  drafts: async () => apiServer<AdminPage<DraftOrder>>("/admin/draft-orders?page=1&pageSize=100", { cookies: await getServerCookieHeader() }),
  posProducts: async () => apiServer<{ items: import("./endpoints").PosProduct[] }>("/admin/pos/products", { cookies: await getServerCookieHeader() }),
};

export const shippingServerApi = {
  list: async () => apiServer<AdminPage<ShippingZone>>("/admin/shipping", { cookies: await getServerCookieHeader() }),
};

// ═══════════════════════════════════════════════════════════
// Categories (server)
// ═══════════════════════════════════════════════════════════

export const categoriesServerApi = {
  list: async (): Promise<Paginated<Category>> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<Paginated<Category>>("/categories/admin/list", {
      cookies: cookieHeader,
    });
  },
  get: async (idOrSlug: string): Promise<{ category: Category }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ category: Category }>(
      `/categories/admin/${idOrSlug}`,
      { cookies: cookieHeader }
    );
  },
};

// ═══════════════════════════════════════════════════════════
// Brands (server)
// ═══════════════════════════════════════════════════════════

export const brandsServerApi = {
  list: async (): Promise<Paginated<Brand>> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<Paginated<Brand>>("/brands/admin/list", {
      cookies: cookieHeader,
    });
  },
  get: async (idOrSlug: string): Promise<{ brand: Brand }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ brand: Brand }>(`/brands/admin/${idOrSlug}`, {
      cookies: cookieHeader,
    });
  },
};

// ═══════════════════════════════════════════════════════════
// Products (server) — hits the ADMIN endpoint
// ═══════════════════════════════════════════════════════════

export const productsServerApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    published?: boolean;
    featured?: boolean;
    sort?: string;
  }): Promise<Paginated<Product>> => {
    const cookieHeader = await getServerCookieHeader();
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiServer<Paginated<Product>>(`/admin/products${qs}`, {
      cookies: cookieHeader,
    });
  },
  get: async (idOrSlug: string): Promise<{ product: Product }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ product: Product }>(`/admin/products/${idOrSlug}`, {
      cookies: cookieHeader,
    });
  },
};

// ═══════════════════════════════════════════════════════════
// Orders (server)
// ═══════════════════════════════════════════════════════════

export const ordersServerApi = {
  listAll: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
      sort?: string;
  }): Promise<Paginated<Order>> => {
    const cookieHeader = await getServerCookieHeader();
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiServer<Paginated<Order>>(`/admin/orders${qs}`, {
      cookies: cookieHeader,
    });
  },
  getOne: async (id: string): Promise<{ order: Order }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ order: Order }>(`/admin/orders/${id}`, {
      cookies: cookieHeader,
    });
  },
};

export const checkoutSessionsServerApi = {
  list: async () => apiServer<{ items: AdminCheckoutSession[]; total: number }>("/admin/orders/checkout-sessions", { cookies: await getServerCookieHeader() }),
};
