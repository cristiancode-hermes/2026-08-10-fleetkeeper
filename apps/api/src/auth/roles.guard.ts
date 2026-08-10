import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * RolesGuard — verifica que el rol del usuario autenticado esté en la
 * lista declarada con @Roles(...). Sin @Roles, no restringe (solo auth).
 * Devuelve false → Nest responde 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string } | undefined;
    return !!user && !!user.role && required.includes(user.role);
  }
}
