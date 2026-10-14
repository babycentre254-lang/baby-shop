import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type AddressDocument = HydratedDocument<Address>;

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
export class Address {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, default: "Home" })
  label!: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true })
  county!: string;

  @Prop({ required: true, trim: true })
  town!: string;

  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ default: false })
  isDefault!: boolean;

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

AddressSchema.index({ userId: 1, isDefault: -1 });