import type {
  Category,
  Brand,
  Product,
  Order,
  Paginated,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateBrandInput,
  UpdateBrandInput,
  CreateProductInput,
  UpdateProductInput,
  UpdateOrderStatusInput,
  ShippingZone,
  CreateShippingZoneInput,
  UpdateShippingZoneInput,
} from "@baby-shop/shared";
import type { AdminPermission } from "@baby-shop/shared";
import { apiClient } from "./client";

// ═══════════════════════════════════════════════════════════
// Auth
// ═══════════════════════════════════════════════════════════

export const authApi = {
  me: () => apiClient<{ user: any }>("/auth/me"),
  changePassword: (input: { currentPassword: string; password: string }) =>
    apiClient<{ passwordChanged: boolean }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () =>
    apiClient<{ loggedOut: boolean }>("/auth/logout", { method: "POST" }),
};

// ═══════════════════════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════════════════════

export const categoriesApi = {
  list: () => apiClient<Paginated<Category>>("/categories/admin/list"),
  get: (idOrSlug: string) =>
    apiClient<{ category: Category }>(`/categories/admin/${idOrSlug}`),
  create: (input: CreateCategoryInput) =>
    apiClient<{ category: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateCategoryInput) =>
    apiClient<{ category: Category }>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiClient<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════════
// Brands
// ═══════════════════════════════════════════════════════════

export const brandsApi = {
  list: () => apiClient<Paginated<Brand>>("/brands/admin/list"),
  get: (idOrSlug: string) =>
    apiClient<{ brand: Brand }>(`/brands/admin/${idOrSlug}`),
  create: (input: CreateBrandInput) =>
    apiClient<{ brand: Brand }>("/brands", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateBrandInput) =>
    apiClient<{ brand: Brand }>(`/brands/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiClient<void>(`/brands/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════════
// Products
// ═══════════════════════════════════════════════════════════

export const productsApi = {
  list: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    published?: boolean;
    featured?: boolean;
    sort?: string;
  }) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiClient<Paginated<Product>>(`/admin/products${qs}`); // ← /admin/products
  },
  get: (idOrSlug: string) =>
    apiClient<{ product: Product }>(`/admin/products/${idOrSlug}`), // ← /admin/products/:id
  create: (input: CreateProductInput) =>
    apiClient<{ product: Product }>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: UpdateProductInput) =>
    apiClient<{ product: Product }>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updateInventory: (id: string, variants: { variantId: string; stock: number }[]) =>
    apiClient<{ product: Product }>(`/admin/products/${id}/inventory`, {
      method: "PATCH",
      body: JSON.stringify({ variants }),
    }),
  remove: (id: string) =>
    apiClient<void>(`/products/${id}`, { method: "DELETE" }),
  addImages: (
    id: string,
    images: { url: string; altText?: string; sortOrder?: number }[]
  ) =>
    apiClient<{ product: Product }>(`/products/${id}/images`, {
      method: "POST",
      body: JSON.stringify({ images }),
    }),
  removeImage: (id: string, imageId: string) =>
    apiClient<{ product: Product }>(`/products/${id}/images/${imageId}`, {
      method: "DELETE",
    }),
};

// ═══════════════════════════════════════════════════════════
// Orders
// ═══════════════════════════════════════════════════════════

export const ordersApi = {
  listAll: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    sort?: string;
  }) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : "";
    return apiClient<Paginated<Order>>(`/admin/orders${qs}`);
  },
  getOne: (id: string) =>
    apiClient<{ order: Order }>(`/admin/orders/${id}`),
  updateStatus: (id: string, input: UpdateOrderStatusInput) =>
    apiClient<{ order: Order }>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};

export interface AdminCheckoutSession {
  _id: string;
  status: "AWAITING_PAYMENT" | "PAYMENT_PENDING" | "PAYMENT_FAILED" | "EXPIRED" | "PAID_REVIEW" | "CANCELLED";
  paymentProvider: "MPESA" | "COD";
  total: number;
  createdAt: string;
  expiresAt: string;
  county?: string;
  town?: string;
  recipient?: string;
  phone?: string;
  inventoryReserved: boolean;
}

export const checkoutSessionsApi = {
  list: () => apiClient<{ items: AdminCheckoutSession[]; total: number }>("/admin/orders/checkout-sessions"),
};

export const shippingAdminApi = {
  list: () => apiClient<AdminPage<ShippingZone>>("/admin/shipping"),
  create: (input: CreateShippingZoneInput) => apiClient<{ zone: ShippingZone }>("/admin/shipping", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: UpdateShippingZoneInput) => apiClient<{ zone: ShippingZone }>(`/admin/shipping/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) => apiClient<void>(`/admin/shipping/${id}`, { method: "DELETE" }),
};

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Branch {
  _id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface DraftOrder {
  _id: string;
  draftNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: { productName: string; sku?: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  notes?: string;
  createdAt: string;
}

export interface PosProduct {
  _id: string;
  name: string;
  image?: string;
  variants: { _id: string; sku: string; size?: string; color?: string; price: number; stock: number }[];
}

export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  permissions: AdminPermission[];
  isEmailVerified: boolean;
  createdAt: string;
}

export interface CustomerStats {
  total: number;
  verified: number;
  unverified: number;
  newLast30Days: number;
}

export interface CustomerDetails {
  customer: AdminUser;
  summary: { totalOrders: number; paidOrders: number; totalSpent: number; latestOrderAt: string | null };
  orders: { _id: string; orderNumber: string; status: string; total: number; paymentProvider: string; createdAt: string; itemCount: number }[];
}

export interface StoreSettings {
  storeName: string;
  currency: string;
  timezone: string;
  supportEmail: string;
  supportPhone: string;
  lowStockThreshold: number;
  maintenanceMode: boolean;
  cashOnDeliveryEnabled: boolean;
}

export interface AdminAnalyticsReport {
  summary: {
    orderCount: number;
    customerCount: number;
    productCount: number;
    pendingOrders: number;
    revenue: number;
    revenueChangePercent: number | null;
    orderChangePercent: number | null;
    lowStockVariants: number;
  };
  currency: string;
  storeName: string;
  dailySales: { date: string; revenue: number; orders: number }[];
  orderStatuses: { status: string; count: number }[];
  recentOrders: { _id: string; orderNumber: string; status: string; total: number; createdAt: string; paymentProvider: string }[];
  topProducts: { _id: string; units: number; revenue: number }[];
  lowStockProducts: { _id: string; name: string; slug: string; image?: string; stock: number; lowStockVariants: number }[];
  rangeDays: number;
}

function queryString(params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return "";
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
  return search.size ? `?${search}` : "";
}

export const adminApi = {
  analytics: (days = 30) => apiClient<AdminAnalyticsReport>(`/admin/analytics?days=${days}`),
  customers: (params?: { page?: number; pageSize?: number; search?: string; verified?: boolean }) => apiClient<AdminPage<AdminUser> & { stats: CustomerStats }>(`/admin/customers${queryString(params)}`),
  customer: (id: string) => apiClient<CustomerDetails>(`/admin/customers/${id}`),
  staff: (params?: { page?: number; pageSize?: number; search?: string }) => apiClient<AdminPage<AdminUser>>(`/admin/staff${queryString(params)}`),
  createStaff: (input: { firstName: string; lastName: string; email: string; password: string; permissions: AdminPermission[] }) => apiClient<{ user: AdminUser }>("/admin/staff", { method: "POST", body: JSON.stringify(input) }),
  updateStaffAccess: (id: string, input: { role?: "ADMIN" | "SUPER_ADMIN"; permissions?: AdminPermission[] }) => apiClient<{ user: AdminUser }>(`/admin/staff/${id}/access`, { method: "PATCH", body: JSON.stringify(input) }),
  branches: () => apiClient<{ branches: Branch[] }>("/admin/branches"),
  createBranch: (input: Omit<Branch, "_id">) => apiClient<{ branch: Branch }>("/admin/branches", { method: "POST", body: JSON.stringify(input) }),
  updateBranch: (id: string, input: Partial<Omit<Branch, "_id">>) => apiClient<{ branch: Branch }>(`/admin/branches/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  removeBranch: (id: string) => apiClient<void>(`/admin/branches/${id}`, { method: "DELETE" }),
  settings: () => apiClient<{ settings: StoreSettings }>("/admin/settings"),
  updateSettings: (input: StoreSettings) => apiClient<{ settings: StoreSettings }>("/admin/settings", { method: "PATCH", body: JSON.stringify(input) }),
  drafts: (params?: { page?: number; pageSize?: number; search?: string }) => apiClient<AdminPage<DraftOrder>>(`/admin/draft-orders${queryString(params)}`),
  createDraft: (input: Omit<DraftOrder, "_id" | "draftNumber" | "subtotal" | "createdAt">) => apiClient<{ draft: DraftOrder }>("/admin/draft-orders", { method: "POST", body: JSON.stringify(input) }),
  removeDraft: (id: string) => apiClient<void>(`/admin/draft-orders/${id}`, { method: "DELETE" }),
  posProducts: (search = "") => apiClient<{ items: PosProduct[] }>(`/admin/pos/products${queryString({ search })}`),
  createPosSale: (input: { customerName: string; customerPhone?: string; customerEmail?: string; paymentMethod: "CASH" | "MPESA"; items: { variantId: string; quantity: number }[]; notes?: string }) => apiClient<{ order: Order }>("/admin/orders/pos", { method: "POST", body: JSON.stringify(input) }),
  promptPosMpesa: (orderId: string, phone: string) => apiClient<{ payment: { status: string; amount: number; phone: string }; message: string }>(`/payments/mpesa/pos/${orderId}`, { method: "POST", body: JSON.stringify({ phone }) }),
};
