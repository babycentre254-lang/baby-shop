import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { ORDER_STATUS, OrderStatus } from "@baby-shop/shared";

export type OrderDocument = HydratedDocument<Order>;

// ═══════════════════════════════════════════════════════════
// Order item snapshot
// ═══════════════════════════════════════════════════════════

@Schema({ _id: false, timestamps: false })
export class OrderItemSnapshot {
  @Prop({ type: Types.ObjectId, ref: "ProductVariant", required: true })
  variantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Product", required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true })
  productName!: string;

  @Prop({ required: true })
  productSlug!: string;

  @Prop({ type: String })
  image?: string;

  @Prop()
  sku!: string;

  @Prop()
  size?: string;

  @Prop()
  color?: string;

  @Prop({ required: true, type: Number, min: 0 })
  unitPrice!: number;

  @Prop({ required: true, type: Number, min: 1 })
  quantity!: number;

  @Prop({ required: true, type: Number, min: 0 })
  lineTotal!: number;

  /** Per-unit weight in grams at time of purchase */
  @Prop({ type: Number, min: 0, default: 0 })
  unitWeightGrams!: number;
}

export const OrderItemSnapshotSchema =
  SchemaFactory.createForClass(OrderItemSnapshot);

// ═══════════════════════════════════════════════════════════
// Shipping address snapshot
// ═══════════════════════════════════════════════════════════

@Schema({ _id: false, timestamps: false })
export class ShippingAddressSnapshot {
  @Prop({ required: true }) fullName!: string;
  @Prop({ required: true }) phone!: string;
  @Prop({ required: true }) county!: string;
  @Prop({ required: true }) town!: string;
  @Prop({ required: true }) street!: string;
  @Prop() notes?: string;
}

export const ShippingAddressSnapshotSchema = SchemaFactory.createForClass(
  ShippingAddressSnapshot
);

// ═══════════════════════════════════════════════════════════
// Shipping metadata (how the fee was calculated)
// ═══════════════════════════════════════════════════════════

@Schema({ _id: false, timestamps: false })
export class ShippingMeta {
  @Prop({ type: Types.ObjectId, ref: "ShippingZone", default: null })
  zoneId?: Types.ObjectId | null;

  @Prop() zoneLabel?: string;

  @Prop() etaText?: string;

  @Prop({ type: Number, min: 0, default: 0 })
  totalWeightGrams!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  baseFee!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  additionalFee!: number;

  /** True if the county wasn't found in the zone table */
  @Prop({ type: Boolean, default: false })
  isFallback!: boolean;
}

export const ShippingMetaSchema = SchemaFactory.createForClass(ShippingMeta);

// ═══════════════════════════════════════════════════════════
// Status history
// ═══════════════════════════════════════════════════════════

@Schema({ _id: false, timestamps: false })
export class OrderStatusEvent {
  @Prop({
    type: String,
    enum: Object.values(ORDER_STATUS),
    required: true,
  })
  status!: OrderStatus;

  @Prop()
  note?: string;

  @Prop({ type: Date, default: Date.now })
  at!: Date;

  @Prop({ type: Types.ObjectId, ref: "User" })
  by?: Types.ObjectId;
}

export const OrderStatusEventSchema =
  SchemaFactory.createForClass(OrderStatusEvent);

// ═══════════════════════════════════════════════════════════
// Order
// ═══════════════════════════════════════════════════════════

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
export class Order {
  @Prop({ type: String, enum: ["ONLINE", "POS"], default: "ONLINE", index: true })
  salesChannel!: "ONLINE" | "POS";

  @Prop({ required: true, unique: true, index: true })
  orderNumber!: string;

  @Prop({ type: Types.ObjectId, ref: "CheckoutSession", sparse: true, unique: true })
  checkoutSessionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
    index: true,
  })
  status!: OrderStatus;

  @Prop({
    type: String,
    enum: ["MPESA", "COD"],
    default: "COD",
  })
  paymentProvider!: "MPESA" | "COD";

  // ─── Money ─────────────────────────────────────────
  @Prop({ required: true, type: Number, min: 0 })
  subtotal!: number;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  shippingFee!: number;

  @Prop({ required: true, type: Number, min: 0, default: 0 })
  discount!: number;

  @Prop({ required: true, type: Number, min: 0 })
  total!: number;

  // ─── Snapshots ────────────────────────────────────
  @Prop({ type: ShippingAddressSnapshotSchema, required: true })
  shippingAddress!: ShippingAddressSnapshot;

  @Prop({ type: ShippingMetaSchema })
  shippingMeta?: ShippingMeta;

  @Prop({ type: [OrderItemSnapshotSchema], default: [] })
  items!: OrderItemSnapshot[];

  @Prop({ type: [OrderStatusEventSchema], default: [] })
  statusHistory!: OrderStatusEvent[];

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  cancelReason?: string;

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "shippingMeta.zoneId": 1 });
