import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type StoreSettingsDocument = HydratedDocument<StoreSettings>;

@Schema({ timestamps: true })
export class StoreSettings {
  @Prop({ default: "Baby Shop" }) storeName!: string;
  @Prop({ default: "KES" }) currency!: string;
  @Prop({ default: "Africa/Nairobi" }) timezone!: string;
  @Prop({ default: "" }) supportEmail!: string;
  @Prop({ default: "" }) supportPhone!: string;
  @Prop({ default: 5, min: 0 }) lowStockThreshold!: number;
  @Prop({ default: false }) maintenanceMode!: boolean;
  @Prop({ default: true }) cashOnDeliveryEnabled!: boolean;
}

export const StoreSettingsSchema = SchemaFactory.createForClass(StoreSettings);

