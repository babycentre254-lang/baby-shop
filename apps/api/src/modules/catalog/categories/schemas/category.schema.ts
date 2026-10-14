import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CategoryDocument = HydratedDocument<Category>;

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
export class Category {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  slug!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  imageUrl?: string;

  /** Single emoji or short string used as a visual icon */
  @Prop({ trim: true })
  icon?: string;

  @Prop({ type: Types.ObjectId, ref: "Category", default: null, index: true })
  parentId?: Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  /** Controls visibility on the storefront */
  @Prop({ default: true })
  isActive!: boolean;

  /** SEO fields */
  @Prop({ trim: true })
  metaTitle?: string;

  @Prop({ trim: true })
  metaDescription?: string;

  @Prop()
  ogImage?: string;

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ parentId: 1, sortOrder: 1 });
CategorySchema.index({ isActive: 1, parentId: 1 });