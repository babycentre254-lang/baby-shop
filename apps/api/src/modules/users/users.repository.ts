import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>
  ) {}

  findById(id: string) {
    return this.model.findById(id).exec();
  }

  findActiveAccessById(id: string) {
    return this.model.findOne({ _id: id, deletedAt: null }).select("role permissions").lean().exec();
  }

  findByEmail(email: string, withPassword = false) {
    const query = this.model.findOne({ email, deletedAt: null });
    if (withPassword) query.select("+passwordHash +refreshTokenVersion");
    return query.exec();
  }

  findByEmailWithReset(email: string) {
    return this.model
      .findOne({ email, deletedAt: null })
      .select("+passwordResetToken +passwordResetExpiresAt +passwordResetAttempts")
      .exec();
  }

  findByEmailWithVerification(email: string) {
    return this.model
      .findOne({ email, deletedAt: null })
      .select("+emailVerificationCodeHash +emailVerificationExpiresAt +emailVerificationAttempts")
      .exec();
  }

  incrementEmailVerificationAttempts(id: string) {
    return this.model.findOneAndUpdate(
      { _id: id, emailVerificationExpiresAt: { $gt: new Date() }, emailVerificationAttempts: { $lt: 5 } },
      { $inc: { emailVerificationAttempts: 1 } },
      { new: true }
    ).exec();
  }

  findByPhone(phone: string) {
    return this.model.findOne({ phone, deletedAt: null }).exec();
  }

  findByIdWithRefreshVersion(id: string) {
    return this.model
      .findById(id)
      .select("+refreshTokenVersion +passwordHash")
      .exec();
  }

  findByResetToken(hashedToken: string) {
    return this.model
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpiresAt: { $gt: new Date() },
        deletedAt: null,
      })
      .select("+passwordResetToken +passwordResetExpiresAt +passwordResetAttempts")
      .exec();
  }

  incrementPasswordResetAttempts(id: string) {
    return this.model
      .findOneAndUpdate(
        {
          _id: id,
          passwordResetExpiresAt: { $gt: new Date() },
          passwordResetAttempts: { $lt: 5 },
        },
        { $inc: { passwordResetAttempts: 1 } },
        { new: true }
      )
      .exec();
  }

  create(data: Partial<User>) {
    return this.model.create(data);
  }

  updateById(id: string, update: Partial<User> | Record<string, unknown>) {
    return this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
  }

  incrementRefreshVersion(id: string) {
    return this.model
      .findByIdAndUpdate(id, { $inc: { refreshTokenVersion: 1 } }, { new: true })
      .exec();
  }

  find(filter: FilterQuery<UserDocument> = {}) {
    return this.model.find({ ...filter, deletedAt: null }).exec();
  }

  count(filter: FilterQuery<UserDocument> = {}) {
    return this.model.countDocuments({ ...filter, deletedAt: null }).exec();
  }

  softDelete(id: string) {
    return this.model
      .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
      .exec();
  }
}
