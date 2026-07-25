import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    // Every non-admin account retains buyer capability even after switching to
    // seller mode (which permanently changes `role` to SELLER) — otherwise
    // buyer-only endpoints (loans, buyback, etc.) would lock sellers out.
    const buyerAllowed = requiredRoles.includes(UserRole.BUYER) && user?.role !== UserRole.ADMIN;

    if (!user || (!requiredRoles.includes(user.role) && !buyerAllowed)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
