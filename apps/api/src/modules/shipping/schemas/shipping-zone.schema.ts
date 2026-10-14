import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ShippingZoneDocument = HydratedDocument<ShippingZone>;

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
export class ShippingZone {
  @Prop({ required: true, unique: true, trim: true, index: true })
  county!: string;

  @Prop({ required: true, type: Number, min: 0 })
  baseFee!: number;

  @Prop({ required: true, type: Number, min: 0, default: 5000 })
  includedGrams!: number;

  @Prop({ required: true, type: Number, min: 0, default: 50 })
  additionalPerKg!: number;

  @Prop({ trim: true })
  label?: string;

  @Prop({ trim: true })
  etaText?: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const ShippingZoneSchema = SchemaFactory.createForClass(ShippingZone);

ShippingZoneSchema.index({ county: 1, isActive: 1 });