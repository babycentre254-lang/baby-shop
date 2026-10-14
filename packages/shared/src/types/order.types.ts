import type { OrderStatus } from "../constants/order-status";

export interface OrderItemSnapshot {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  image?: string;
  sku: string;
  size?: string;
  color?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  county: string;
  town: string;
  street: string;
  notes?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  note?: string;
  at: string;
  by?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  checkoutSessionId?: string;
  salesChannel?: "ONLINE" | "POS";
  userId: string;
  status: OrderStatus;
  paymentProvider: "MPESA" | "COD";
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  shippingAddress: ShippingAddressSnapshot;
  shippingMeta?: {
    zoneId: string | null;
    zoneLabel?: string;
    etaText?: string;
    totalWeightGrams: number;
    baseFee: number;
    additionalFee: number;
    isFallback: boolean;
  };
  items: OrderItemSnapshot[];
  statusHistory: OrderStatusEvent[];
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type CheckoutSessionStatus =
  | "AWAITING_PAYMENT"
  | "PAYMENT_PENDING"
  | "PAYMENT_FAILED"
  | "COMPLETED"
  | "EXPIRED"
  | "PAID_REVIEW"
  | "CANCELLED";

export interface CheckoutSession {
  _id: string;
  status: CheckoutSessionStatus;
  paymentProvider: "MPESA" | "COD";
  subtotal: number;
  shippingFee: number;
  total: number;
  expiresAt: string;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
}
