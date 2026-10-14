import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CartDocument = HydratedDocument<Cart>;

@Schema({ _id: true, timestamps: false })
export class CartItem {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "ProductVariant", required: true })
  variantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Product", required: true })
  productId!: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 1 })
  quantity!: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

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
export class Cart {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items!: CartItem[];

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CartSchema = SchemaFactory.createForClass(Cart);