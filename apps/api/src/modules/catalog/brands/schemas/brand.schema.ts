import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type BrandDocument = HydratedDocument<Brand>;

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
export class Brand {
  @Prop({ required: true, trim: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, index: true })
  slug!: string;

  @Prop()
  logoUrl?: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ default: true })
  isActive!: boolean;

  // SEO
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

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.index({ isActive: 1, name: 1 });