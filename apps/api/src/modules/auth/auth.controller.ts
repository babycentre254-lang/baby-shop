import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { CookieService, REFRESH_COOKIE } from "./cookie.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "../users/users.service";
import { Throttle } from "@nestjs/throttler";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type RegisterInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
  updateProfileSchema,
  type UpdateProfileInput,
  changePasswordSchema,
  type ChangePasswordInput,
} from "@baby-shop/shared";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly cookies: CookieService
  ) {}

  @Public()
  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new customer account" })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput
  ) {
    const { user } = await this.auth.register(dto);
    return { verificationRequired: true, email: user.email };
  }

  @Public()
  @Post("verify-email")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailInput,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, tokens } = await this.auth.verifyEmail(dto);
    this.cookies.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { user };
  }

  @Public()
  @Post("resend-verification")
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordInput
  ) {
    await this.auth.resendEmailVerification(dto.email);
    return { sent: true, message: "If verification is needed, a new code is on its way." };
  }

  @Public()
  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in with email + password" })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginInput,
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, tokens } = await this.auth.login(dto);
    this.cookies.setAuthCookies(
      res,
      tokens.accessToken,
      tokens.refreshToken,
      dto.rememberMe ?? true
    );
    return { user };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate tokens using the refresh cookie" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException({
        code: "NO_REFRESH_TOKEN",
        message: "No refresh token provided",
      });
    }
    const tokens = await this.auth.refresh(token);
    this.cookies.setAuthCookies(
      res,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.rememberMe
    );
    return { refreshed: true };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log out and revoke all sessions" })
  async logout(
    @CurrentUser("sub") userId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.auth.logout(userId);
    this.cookies.clearAuthCookies(res);
    return { loggedOut: true };
  }

  @Get("me")
  @ApiOperation({ summary: "Get the current user" })
  async me(@CurrentUser("sub") userId: string) {
    const user = await this.users.findByIdOrFail(userId);
    return { user };
  }

  @Patch("me")
  @ApiOperation({ summary: "Update the current user's profile" })
  async updateMe(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileInput
  ) {
    const user = await this.users.updateProfile(userId, dto);
    return { user };
  }

  @Post("change-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser("sub") userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordInput,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.auth.changePassword(userId, dto);
    this.cookies.setAuthCookies(res, tokens.accessToken, tokens.refreshToken, true);
    return { passwordChanged: true };
  }

  @Public()
  @Post("forgot-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema))
    dto: ForgotPasswordInput
  ) {
    await this.auth.requestPasswordReset(dto.email);
    return {
      sent: true,
      message: "If an account exists for that email, a reset code is on its way.",
    };
  }

  @Public()
  @Post("reset-password")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordInput
  ) {
    await this.auth.resetPassword(dto);
    return { reset: true };
  }
}
