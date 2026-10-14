import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@baby-shop/shared";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AccessTokenPayload } from "../../modules/auth/token.service";
import { UsersService } from "../../modules/users/users.service";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly users: UsersService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AccessTokenPayload | undefined;

    if (!user?.sub) {
      throw new ForbiddenException({
        code: "INSUFFICIENT_ROLE",
        message: "You do not have permission to perform this action",
      });
    }
    const current = await this.users.findActiveAccessById(user.sub);
    if (!current || !requiredRoles.includes(current.role as Role)) {
      throw new ForbiddenException({
        code: "INSUFFICIENT_ROLE",
        message: "You do not have permission to perform this action",
      });
    }
    req.user = { ...user, role: current.role, permissions: current.permissions ?? [] };
    return true;
  }
}
