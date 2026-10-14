import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type DraftOrderDocument = HydratedDocument<DraftOrder>;

@Schema({ _id: false })
export class DraftOrderItem {
  @Prop({ type: Types.ObjectId, ref: "Product" }) productId?: Types.ObjectId;
  @Prop({ required: true, trim: true }) productName!: string;
  @Prop({ trim: true }) sku?: string;
  @Prop({ required: true, min: 1 }) quantity!: number;
  @Prop({ required: true, min: 0 }) unitPrice!: number;
}
const DraftOrderItemSchema = SchemaFactory.createForClass(DraftOrderItem);

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class DraftOrder {
  @Prop({ required: true, unique: true }) draftNumber!: string;
  @Prop({ required: true, trim: true }) customerName!: string;
  @Prop({ trim: true, lowercase: true }) customerEmail?: string;
  @Prop({ trim: true }) customerPhone?: string;
  @Prop({ type: [DraftOrderItemSchema], default: [] }) items!: DraftOrderItem[];
  @Prop({ required: true, min: 0, default: 0 }) subtotal!: number;
  @Prop({ trim: true }) notes?: string;
  @Prop({ type: Types.ObjectId, ref: "User", required: true }) createdBy!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const DraftOrderSchema = SchemaFactory.createForClass(DraftOrder);

