import type {
  Category,
  Brand,
  Product,
  Paginated,
  Address,
  Order,
  ShippingZone,
  ShippingQuote,
  LoginInput,
  RegisterInput,
  CreateAddressInput,
  CheckoutInput,
  InitiateMpesaPaymentInput,
  UpdateProfileInput,
} from "@baby-shop/shared/";
import { apiClient } from "./client";

// ─── Auth (client) ──────────────────────────────────────
export const authApi = {
  me: () => apiClient<{ user: any }>("/auth/me"),
  updateProfile: (input: UpdateProfileInput) => apiClient<{ user: any }>("/auth/me", { method: "PATCH", body: JSON.stringify(input) }),
  logout: () =>
    apiClient<{ loggedOut: boolean }>("/auth/logout", { method: "POST" }),
};

// ─── Catalog (client) ───────────────────────────────────
export const catalogApi = {
  listCategories: (params?: { rootOnly?: boolean }) =>
    apiClient<Paginated<Category>>(
      `/categories${params?.rootOnly ? "?rootOnly=true" : ""}`
    ),
  getCategory: (slugOrId: string) =>
    apiClient<{ category: Category }>(`/categories/${slugOrId}`),

  listBrands: () => apiClient<Paginated<Brand>>("/brands"),

  listProducts: (query?: Record<string, string | number | boolean | undefined>) => {
    const qs = query
      ? "?" +
        new URLSearchParams(
          Object.entries(query)
            .filter(([_, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiClient<Paginated<Product>>(`/products${qs}`);
  },
  getProduct: (slugOrId: string) =>
    apiClient<{ product: Product }>(`/products/${slugOrId}`),
};

// ─── Cart (client) ──────────────────────────────────────
export const cartApi = {
  get: () => apiClient<{ cart: any }>("/cart"),
  addItem: (variantId: string, quantity: number) =>
    apiClient<{ cart: any }>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ variantId, quantity }),
    }),
  updateItem: (itemId: string, quantity: number) =>
    apiClient<{ cart: any }>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),
  removeItem: (itemId: string) =>
    apiClient<{ cart: any }>(`/cart/items/${itemId}`, { method: "DELETE" }),
  clear: () => apiClient<void>("/cart", { method: "DELETE" }),

  /** Merge guest cart items into the authenticated user's server cart */
  merge: (items: { variantId: string; quantity: number }[]) =>
    apiClient<{ cart: any }>("/cart/merge", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};

// ─── Addresses (client) ─────────────────────────────────
export const addressesApi = {
  list: () => apiClient<{ items: Address[] }>("/users/me/addresses"),
  create: (input: CreateAddressInput) =>
    apiClient<{ address: Address }>("/users/me/addresses", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Partial<CreateAddressInput>) =>
    apiClient<{ address: Address }>(`/users/me/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiClient<void>(`/users/me/addresses/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════════
// Shipping (client)
// ═══════════════════════════════════════════════════════════

export const shippingApi = {
  listZones: () =>
    apiClient<Paginated<ShippingZone>>("/shipping/zones"),

  quote: (input: { county: string; totalWeightGrams: number }) =>
    apiClient<ShippingQuote>("/shipping/quote", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

// ═══════════════════════════════════════════════════════════
// Checkout (client)
// ═══════════════════════════════════════════════════════════

export const checkoutApi = {
  options: () => apiClient<{ cashOnDeliveryEnabled: boolean }>("/storefront/checkout-options"),
  placeOrder: (input: {
    addressId: string;
    paymentProvider: "MPESA" | "COD";
    notes?: string;
    expectedShippingFee?: number;
  }) =>
    apiClient<{ session: import("@baby-shop/shared").CheckoutSession; order: Order | null }>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

// ─── Orders (client) ────────────────────────────────────
export const ordersApi = {
  checkout: (input: CheckoutInput) =>
    apiClient<{ session: import("@baby-shop/shared").CheckoutSession; order: Order | null }>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  listMine: (params?: { page?: number; pageSize?: number; status?: string }) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiClient<Paginated<Order>>(`/orders${qs}`);
  },
  getMine: (id: string) => apiClient<{ order: Order }>(`/orders/${id}`),
  cancel: (id: string, reason?: string) =>
    apiClient<{ order: Order }>(`/orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ─── Payments (client) ──────────────────────────────────
export const paymentsApi = {
  initiateMpesa: (input: { sessionId?: string; orderId?: string; phone: string }) =>
    apiClient<{ payment: any; message: string }>("/payments/mpesa/stkpush", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getCheckoutSessionStatus: (sessionId: string) =>
    apiClient<{
      session: {
        _id: string;
        status: import("@baby-shop/shared").CheckoutSessionStatus;
        paymentProvider: "MPESA" | "COD";
        total: number;
        expiresAt: string;
        legacy?: boolean;
      };
      order: { _id: string; orderNumber: string; status: string; total: number } | null;
      payment: {
        _id: string;
        status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
        amount: number;
        phone: string;
        mpesaReceiptNumber?: string;
        resultCode?: number;
        resultDesc?: string;
        resultLabel?: string;
        retryable?: boolean;
        userMessage?: string;
      } | null;
    }>(`/payments/checkout-session/${sessionId}/status`),
};
