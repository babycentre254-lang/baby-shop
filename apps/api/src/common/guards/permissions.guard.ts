import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission, ROLES } from "@baby-shop/shared";
import type { AccessTokenPayload } from "../../modules/auth/token.service";
import type { AdminPermission } from "@baby-shop/shared";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";

type PermissionPayload = AccessTokenPayload & { permissions?: AdminPermission[] };

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as PermissionPayload | undefined;
    if (user?.role === ROLES.SUPER_ADMIN) return true;
    if (!user || !required.some((permission) => hasPermission(user.permissions ?? [], permission))) {
      throw new ForbiddenException({
        code: "INSUFFICIENT_PERMISSION",
        message: "Your admin account does not have access to this feature.",
      });
    }
    return true;
  }
}
