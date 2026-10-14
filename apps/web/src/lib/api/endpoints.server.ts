import "server-only";

import { cookies } from "next/headers";
import type {
  Category,
  Brand,
  Product,
  Paginated,
  Order,
  Address,
} from "@baby-shop/shared/src/types/index";
import type { LoginInput, RegisterInput } from "@baby-shop/shared";
import { apiServer } from "./client.server";
async function getServerCookieHeader(): Promise<string> {
  const store = await cookies();
  return store.toString();
}

export const authServerApi = {
  register: async (
    input: RegisterInput,
    cookieHeader?: string
  ): Promise<{ user: any }> => {
    return apiServer<{ user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
      cookies: cookieHeader,
    });
  },
  login: async (
    input: LoginInput,
    cookieHeader?: string
  ): Promise<{ user: any }> => {
    return apiServer<{ user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      cookies: cookieHeader,
    });
  },
  me: async (): Promise<{ user: any }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ user: any }>("/auth/me", { cookies: cookieHeader });
  },
};

export const catalogServerApi = {
  listCategories: async (params?: {
    rootOnly?: boolean;
  }): Promise<Paginated<Category>> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<Paginated<Category>>(
      `/categories${params?.rootOnly ? "?rootOnly=true" : ""}`,
      { cookies: cookieHeader }
    );
  },
  getCategory: async (
    slugOrId: string
  ): Promise<{ category: Category }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ category: Category }>(`/categories/${slugOrId}`, {
      cookies: cookieHeader,
    });
  },
  listBrands: async (): Promise<Paginated<Brand>> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<Paginated<Brand>>("/brands", {
      cookies: cookieHeader,
    });
  },
  listProducts: async (
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<Paginated<Product>> => {
    const cookieHeader = await getServerCookieHeader();
    const qs = query
      ? "?" +
        new URLSearchParams(
          Object.entries(query)
            .filter(([_, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiServer<Paginated<Product>>(`/products${qs}`, {
      cookies: cookieHeader,
    });
  },
  getProduct: async (
    slugOrId: string
  ): Promise<{ product: Product }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ product: Product }>(`/products/${slugOrId}`, {
      cookies: cookieHeader,
    });
  },
};

export const cartServerApi = {
  get: async (): Promise<{ cart: any }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ cart: any }>("/cart", { cookies: cookieHeader });
  },
};

export const addressesServerApi = {
  list: async (): Promise<{ items: Address[] }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ items: Address[] }>("/users/me/addresses", {
      cookies: cookieHeader,
    });
  },
};

export const ordersServerApi = {
  trendingProducts: async (): Promise<{ items: Product[] }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ items: Product[] }>("/orders/trending-products", {
      cookies: cookieHeader,
    });
  },
  listMine: async (params?: {
    page?: number;
    status?: string;
  }): Promise<Paginated<Order>> => {
    const cookieHeader = await getServerCookieHeader();
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiServer<Paginated<Order>>(`/orders${qs}`, {
      cookies: cookieHeader,
    });
  },
  getMine: async (id: string): Promise<{ order: Order }> => {
    const cookieHeader = await getServerCookieHeader();
    return apiServer<{ order: Order }>(`/orders/${id}`, {
      cookies: cookieHeader,
    });
  },
};
