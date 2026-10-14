import type { Role } from "../constants/roles";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  county: string;
  town: string;
  street: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  variantId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  availableStock: number;
  product: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
  variant: {
    sku: string;
    size?: string;
    color?: string;
  };
}

export interface Cart {
  _id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  totalWeightGrams: number;
}