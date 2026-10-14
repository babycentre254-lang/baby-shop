import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: true, timestamps: false })
export class ProductVariant {
  @Prop({ required: true, trim: true })
  sku!: string;

  @Prop({ trim: true })
  size?: string;

  @Prop({ trim: true })
  color?: string;

  @Prop({ required: true, type: Number, min: 0 })
  price!: number;

  @Prop({ default: 0, type: Number, min: 0 })
  stock!: number;

  @Prop({ default: 5, type: Number, min: 0 })
  lowStockAt!: number;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ _id: true, timestamps: false })
export class ProductImage {
  @Prop({ required: true })
  url!: string;

  @Prop({ trim: true })
  altText?: string;

  @Prop({ default: 0, type: Number, min: 0 })
  sortOrder!: number;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

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
export class Product {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ trim: true })
  shortDesc?: string;

  @Prop({ type: Types.ObjectId, ref: "Category", required: true, index: true })
  categoryId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Brand", default: null, index: true })
  brandId?: Types.ObjectId | null;

  @Prop({ required: true, type: Number, min: 0 })
  basePrice!: number;

  @Prop({ type: Number, min: 0, default: null })
  salePrice?: number | null;

  @Prop({ required: true, unique: true, trim: true, index: true })
  sku!: string;

  @Prop({ trim: true })
  ageRange?: string;

  @Prop({ trim: true })
  material?: string;

  @Prop({ type: [String], default: [] })
  safetyCerts!: string[];

  @Prop({ default: false, index: true })
  isPublished!: boolean;

  @Prop({ default: false, index: true })
  isFeatured!: boolean;

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants!: ProductVariant[];

  @Prop({ type: [ProductImageSchema], default: [] })
  images!: ProductImage[];

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ name: "text", description: "text", shortDesc: "text" });
ProductSchema.index({ categoryId: 1, isPublished: 1, createdAt: -1 });
ProductSchema.index({ brandId: 1, isPublished: 1, createdAt: -1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ isFeatured: 1, isPublished: 1 });