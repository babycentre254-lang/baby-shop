import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { PAYMENT_STATUS, PaymentStatus, PAYMENT_PROVIDER } from "@baby-shop/shared";

export type PaymentDocument = HydratedDocument<Payment>;

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
export class Payment {
  @Prop({ type: Types.ObjectId, ref: "Order", index: true })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "CheckoutSession", index: true })
  checkoutSessionId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PAYMENT_PROVIDER),
    default: PAYMENT_PROVIDER.MPESA,
  })
  provider!: string;

  @Prop({
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
    index: true,
  })
  status!: PaymentStatus;

  @Prop({ required: true, type: Number, min: 0 })
  amount!: number;

  @Prop({ trim: true })
  phone!: string;

  // M-Pesa specific fields
  @Prop({ index: true })
  merchantRequestId?: string;

  @Prop({ unique: true, sparse: true, index: true })
  checkoutRequestId?: string;

  @Prop()
  mpesaReceiptNumber?: string;

  @Prop()
  resultCode?: number;

  @Prop()
  resultDesc?: string;

  @Prop({ type: Object })
  providerResponse?: Record<string, unknown>;
  @Prop()
resultLabel?: string;    

@Prop({ type: Boolean, default: false })
retryable?: boolean;      

@Prop()
userMessage?: string;   

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ orderId: 1, status: 1 });
PaymentSchema.index({ checkoutSessionId: 1, status: 1 });
