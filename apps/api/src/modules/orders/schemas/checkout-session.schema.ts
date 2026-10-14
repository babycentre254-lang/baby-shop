import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export const CHECKOUT_SESSION_STATUS = {
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  PAYMENT_PENDING: "PAYMENT_PENDING",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  COMPLETED: "COMPLETED",
  EXPIRED: "EXPIRED",
  PAID_REVIEW: "PAID_REVIEW",
  CANCELLED: "CANCELLED",
} as const;

export type CheckoutSessionStatus =
  (typeof CHECKOUT_SESSION_STATUS)[keyof typeof CHECKOUT_SESSION_STATUS];
export type CheckoutSessionDocument = HydratedDocument<CheckoutSession>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class CheckoutSession {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(CHECKOUT_SESSION_STATUS), required: true, index: true })
  status!: CheckoutSessionStatus;

  @Prop({ type: String, enum: ["MPESA", "COD"], required: true })
  paymentProvider!: "MPESA" | "COD";

  @Prop({ type: Object, required: true })
  shippingAddress!: Record<string, unknown>;

  @Prop({ type: Object, required: true })
  shippingMeta!: Record<string, unknown>;

  @Prop({ type: [Object], required: true })
  items!: Record<string, unknown>[];

  @Prop({ required: true, type: Number, min: 0 })
  subtotal!: number;

  @Prop({ required: true, type: Number, min: 0 })
  shippingFee!: number;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  discount!: number;

  @Prop({ required: true, type: Number, min: 0 })
  total!: number;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: "Order", default: null })
  orderId?: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false })
  inventoryReserved!: boolean;

  @Prop({ type: Date, required: true, index: true })
  expiresAt!: Date;

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CheckoutSessionSchema = SchemaFactory.createForClass(CheckoutSession);
CheckoutSessionSchema.index({ userId: 1, status: 1, createdAt: -1 });
