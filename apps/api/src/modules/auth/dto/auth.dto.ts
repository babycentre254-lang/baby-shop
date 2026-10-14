import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@baby-shop/shared";

/**
 * These are plain type re-exports — validation happens in the controller
 * via ZodValidationPipe with the shared schemas.
 */
export type RegisterDto = RegisterInput;
export type LoginDto = LoginInput;
export type ForgotPasswordDto = ForgotPasswordInput;
export type ResetPasswordDto = ResetPasswordInput;