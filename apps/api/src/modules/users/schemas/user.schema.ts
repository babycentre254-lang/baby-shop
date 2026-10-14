import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { ROLES, Role } from "@baby-shop/shared";
import type { AdminPermission } from "@baby-shop/shared";

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
transform: (_doc, ret: Record<string, unknown>) => {
  delete ret.passwordHash;
  delete ret.refreshTokenVersion;
  delete ret.passwordResetToken;
  delete ret.passwordResetExpiresAt;
  delete ret.passwordResetAttempts;
  delete ret.emailVerificationCodeHash;
  delete ret.emailVerificationExpiresAt;
  delete ret.emailVerificationAttempts;
  delete ret.__v;
  return ret;
},
  },
})
export class User {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ unique: true, sparse: true, trim: true })
  phone?: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER })
  role!: Role;

  @Prop({ type: [String], default: [] })
  permissions!: AdminPermission[];

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: Date, default: null })
  emailVerifiedAt?: Date | null;

  /**
   * Incremented on logout-all, password change, or forced invalidation.
   * Any refresh token with a lower version is rejected.
   */
  @Prop({ default: 0, select: false })
  refreshTokenVersion!: number;

  @Prop({ type: Date, default: null, select: false })
  lastLoginAt?: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  // ─── Password reset ─────────────────────────────────
  @Prop({ type: String, default: null, select: false })
  passwordResetToken?: string | null;

  @Prop({ type: Date, default: null, select: false })
  passwordResetExpiresAt?: Date | null;

  @Prop({ type: Number, default: 0, select: false })
  passwordResetAttempts!: number;

  @Prop({ type: String, default: null, select: false })
  emailVerificationCodeHash?: string | null;

  @Prop({ type: Date, default: null, select: false })
  emailVerificationExpiresAt?: Date | null;

  @Prop({ type: Number, default: 0, select: false })
  emailVerificationAttempts!: number;

  _id!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual: fullName
UserSchema.virtual("fullName").get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Index for soft-delete + unique email (only active users)
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);
