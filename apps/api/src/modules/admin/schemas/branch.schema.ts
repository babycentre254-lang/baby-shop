import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type BranchDocument = HydratedDocument<Branch>;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Branch {
  @Prop({ required: true, trim: true }) name!: string;
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) code!: string;
  @Prop({ required: true, trim: true }) address!: string;
  @Prop({ trim: true }) city?: string;
  @Prop({ trim: true }) phone?: string;
  @Prop({ trim: true }) email?: string;
  @Prop({ default: true }) isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

