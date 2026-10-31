import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { UsersRepository } from "./users.repository";
import { UserDocument } from "./schemas/user.schema";
import type { UpdateProfileInput } from "@baby-shop/shared";

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    const exists = await this.repo.findByEmail(input.email);
    if (exists) {
      throw new BadRequestException({
        code: "EMAIL_TAKEN",
        message: "An account with this email already exists",
      });
    }

    if (input.phone) {
      const phoneExists = await this.repo.findByPhone(input.phone);
      if (phoneExists) {
        throw new BadRequestException({
          code: "PHONE_TAKEN",
          message: "An account with this phone number already exists",
        });
      }
    }

    return this.repo.create(input);
  }

  async findByIdOrFail(id: string): Promise<UserDocument> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }
    return user;
  }

  async findActiveAccessById(id: string) {
    return this.repo.findActiveAccessById(id);
  }

  async findByEmailWithPassword(email: string) {
    return this.repo.findByEmail(email, true);
  }

  async findByIdWithPassword(id: string) {
    return this.repo.findByIdWithRefreshVersion(id);
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserDocument> {
    if (input.phone) {
      const phoneOwner = await this.repo.findByPhone(input.phone);
      if (phoneOwner && phoneOwner._id.toString() !== userId) {
        throw new BadRequestException({
          code: "PHONE_TAKEN",
          message: "Phone number already in use",
        });
      }
    }
    const updated = await this.repo.updateById(userId, input);
    if (!updated) throw new NotFoundException("User not found");
    return updated;
  }

  async recordLogin(userId: string) {
    await this.repo.updateById(userId, { lastLoginAt: new Date() });
  }

  async bumpRefreshVersion(userId: string) {
    return this.repo.incrementRefreshVersion(userId);
  }

  async getRefreshVersion(userId: string): Promise<number> {
    const user = await this.repo.findByIdWithRefreshVersion(userId);
    return user?.refreshTokenVersion ?? 0;
  }

    // Add these methods to UsersService:

  async setPasswordResetToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date
  ) {
    return this.repo.updateById(userId, {
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: expiresAt,
      passwordResetAttempts: 0,
    });
  }

  async findByEmailWithReset(email: string) {
    return this.repo.findByEmailWithReset(email);
  }

  async findByEmailWithVerification(email: string) {
    return this.repo.findByEmailWithVerification(email);
  }

  async setEmailVerificationCode(userId: string, codeHash: string, expiresAt: Date) {
    return this.repo.updateById(userId, {
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: expiresAt,
      emailVerificationAttempts: 0,
    });
  }

  async incrementEmailVerificationAttempts(userId: string) {
    return this.repo.incrementEmailVerificationAttempts(userId);
  }

  async markEmailVerified(userId: string) {
    return this.repo.updateById(userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationCodeHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationAttempts: 0,
    });
  }

  async incrementPasswordResetAttempts(userId: string) {
    return this.repo.incrementPasswordResetAttempts(userId);
  }

  async clearPasswordResetToken(userId: string) {
    return this.repo.updateById(userId, {
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      passwordResetAttempts: 0,
    });
  }

  async findByResetToken(hashedToken: string) {
    return this.repo.findByResetToken(hashedToken);
  }

  async setPasswordHash(userId: string, passwordHash: string) {
    return this.repo.updateById(userId, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      passwordResetAttempts: 0,
    });
  }
}
