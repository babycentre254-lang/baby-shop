import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

import { TokenService } from "../../modules/auth/token.service";
import { ACCESS_COOKIE } from "../../modules/auth/cookie.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    // Accept cookie first, then Authorization: Bearer
    const cookieToken = req.cookies?.[ACCESS_COOKIE];
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined;
    const token = cookieToken ?? headerToken;

    if (!token) {
      throw new UnauthorizedException({
        code: "NO_TOKEN",
        message: "Authentication required",
      });
    }

    const payload = await this.tokens.verifyAccessToken(token);
    (req as Request & { user: unknown }).user = payload;
    return true;
  }
}