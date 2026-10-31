import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, randomInt, timingSafeEqual } from "crypto";

import { UsersService } from "../users/users.service";
import { TokenService } from "./token.service";
import { MailService } from "./mail.service";
import type { UserDocument } from "../users/schemas/user.schema";
import type {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
  ChangePasswordInput,
  VerifyEmailInput,
} from "@baby-shop/shared";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
    private readonly config: ConfigService
  ) {}

  async register(input: RegisterInput): Promise<{ user: UserDocument }> {
    const passwordHash = await this.users.hashPassword(input.password);
    const user = await this.users.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });
    await this.sendEmailVerificationCode(user);
    return { user };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<{ user: UserDocument; tokens: AuthTokens }> {
    const user = await this.users.findByEmailWithVerification(input.email);
    const invalidCode = () => new BadRequestException({
      code: "INVALID_VERIFICATION_CODE",
      message: "That code is invalid or expired. Request a new one and try again.",
    });
    if (!user || !user.emailVerificationCodeHash || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date() || user.emailVerificationAttempts >= 5) {
      throw invalidCode();
    }
    const expected = Buffer.from(user.emailVerificationCodeHash, "hex");
    const actual = Buffer.from(this.hashEmailVerificationCode(user._id.toString(), input.code), "hex");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      await this.users.incrementEmailVerificationAttempts(user._id.toString());
      throw invalidCode();
    }
    const verified = await this.users.markEmailVerified(user._id.toString());
    if (!verified) throw invalidCode();
    const tokens = await this.issueTokens(verified, true);
    await this.users.recordLogin(verified._id.toString());
    void this.mail.sendWelcome({ to: verified.email, firstName: verified.firstName }).catch(() =>
      this.logger.warn("Welcome email could not be delivered")
    );
    return { user: verified, tokens };
  }

  async resendEmailVerification(email: string): Promise<void> {
    const user = await this.users.findByEmailWithVerification(email);
    if (!user || user.isEmailVerified) return;
    await this.sendEmailVerificationCode(user);
  }

  private async sendEmailVerificationCode(user: UserDocument): Promise<void> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await this.users.setEmailVerificationCode(
      user._id.toString(),
      this.hashEmailVerificationCode(user._id.toString(), code),
      new Date(Date.now() + 10 * 60_000)
    );
    try {
      await this.mail.sendEmailVerificationCode({ to: user.email, firstName: user.firstName, code });
    } catch (error) {
      this.logger.error(`Verification email could not be delivered: ${error instanceof Error ? error.message : "unknown error"}`);
      // Account remains unverified; the resend endpoint can issue a fresh code.
    }
  }

  async login(input: LoginInput): Promise<{
    user: UserDocument;
    tokens: AuthTokens;
  }> {
    const user = await this.users.findByEmailWithPassword(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    const valid = await this.users.verifyPassword(
      input.password,
      user.passwordHash
    );
    if (!valid) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    if (user.role === "CUSTOMER" && !user.isEmailVerified) {
      throw new UnauthorizedException({
        code: "EMAIL_NOT_VERIFIED",
        message: "Verify your email address before signing in.",
      });
    }

    const rememberMe = input.rememberMe ?? true;
    const tokens = await this.issueTokens(user, rememberMe);
    await this.users.recordLogin(user._id.toString());
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.tokens.verifyRefreshToken(refreshToken);
    const currentVersion = await this.users.getRefreshVersion(payload.sub);

    if (payload.ver !== currentVersion) {
      throw new UnauthorizedException({
        code: "REFRESH_REVOKED",
        message: "Session expired. Please log in again.",
      });
    }

    const user = await this.users.findByIdOrFail(payload.sub);
    // Rotate the refresh-token family version so a copied token cannot be reused.
    await this.users.bumpRefreshVersion(user._id.toString());
    return this.issueTokens(user, payload.rememberMe !== false);
  }

  async logout(userId: string): Promise<void> {
    await this.users.bumpRefreshVersion(userId);
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<AuthTokens> {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user?.passwordHash || !(await this.users.verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException({ code: "INVALID_CURRENT_PASSWORD", message: "Current password is incorrect." });
    }
    if (await this.users.verifyPassword(input.password, user.passwordHash)) {
      throw new BadRequestException({ code: "PASSWORD_UNCHANGED", message: "Choose a password you have not used for this account." });
    }
    await this.users.setPasswordHash(userId, await this.users.hashPassword(input.password));
    await this.users.bumpRefreshVersion(userId);
    const tokens = await this.issueTokens(user, true);
    void this.mail.sendPasswordChanged({ to: user.email, firstName: user.firstName }).catch(() =>
      this.logger.warn("Password change notification could not be delivered")
    );
    return tokens;
  }

  async issueTokens(user: UserDocument, rememberMe = true): Promise<AuthTokens> {
    const version = await this.users.getRefreshVersion(user._id.toString());
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken({
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      }),
      this.tokens.signRefreshToken({
        sub: user._id.toString(),
        ver: version,
        rememberMe,
      }),
    ]);
    return { accessToken, refreshToken, rememberMe };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user) return;

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hashed = this.hashResetCode(user._id.toString(), code);
    await this.users.setPasswordResetToken(
      user._id.toString(),
      hashed,
      new Date(Date.now() + 1000 * 60 * 10)
    );

    try {
      await this.mail.sendPasswordResetCode({
        to: user.email,
        firstName: user.firstName,
        code,
      });
    } catch (error) {
      await this.users.clearPasswordResetToken(user._id.toString());
      // Keep a uniform response for known and unknown addresses. Never log codes.
      this.logger.error(
        `Password reset email could not be delivered: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const user = await this.users.findByEmailWithReset(input.email);
    const invalidCode = () =>
      new BadRequestException({
        code: "INVALID_RESET_CODE",
        message: "That code is invalid or expired. Request a new one and try again.",
      });

    if (
      !user ||
      !user.passwordResetToken ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt <= new Date() ||
      user.passwordResetAttempts >= 5
    ) {
      throw invalidCode();
    }

    const expected = Buffer.from(user.passwordResetToken, "hex");
    const actual = Buffer.from(
      this.hashResetCode(user._id.toString(), input.code),
      "hex"
    );
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      await this.users.incrementPasswordResetAttempts(user._id.toString());
      throw invalidCode();
    }

    const passwordHash = await this.users.hashPassword(input.password);
    await this.users.setPasswordHash(user._id.toString(), passwordHash);
    await this.users.bumpRefreshVersion(user._id.toString());
    void this.mail.sendPasswordChanged({ to: user.email, firstName: user.firstName }).catch(() =>
      this.logger.warn("Password reset notification could not be delivered")
    );
  }

  private hashResetCode(userId: string, code: string): string {
    const secret = this.config.getOrThrow<string>("jwt.accessSecret");
    return createHmac("sha256", secret)
      .update(`${userId}:${code}`)
      .digest("hex");
  }

  private hashEmailVerificationCode(userId: string, code: string): string {
    const secret = this.config.getOrThrow<string>("jwt.accessSecret");
    return createHmac("sha256", secret).update(`email-verify:${userId}:${code}`).digest("hex");
  }
}
