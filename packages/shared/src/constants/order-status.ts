export const ORDER_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_VALUES: OrderStatus[] = Object.values(ORDER_STATUS);

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_PROVIDER = {
  MPESA: "MPESA",
  STRIPE: "STRIPE",
  COD: "COD",
} as const;

export type PaymentProvider =
  (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER];