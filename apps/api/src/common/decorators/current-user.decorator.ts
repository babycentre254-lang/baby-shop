import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AccessTokenPayload } from "../../modules/auth/token.service";

/**
 * Usage:
 *   @CurrentUser() user: AccessTokenPayload
 *   @CurrentUser("sub") userId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AccessTokenPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AccessTokenPayload | undefined;
    if (!user) return undefined;
    return data ? user[data] : user;
  }
);