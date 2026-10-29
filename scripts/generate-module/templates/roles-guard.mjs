// Shared guard created once when accessControl is on and the project has no RolesGuard yet
export function rolesGuardTemplate({ roleClaim }) {
  return `import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Allows the request when the JWT "${roleClaim}" claim (string or array) matches one of the @Roles(...) values.
// Must run after the authentication guard that sets request.user.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const claim = context.switchToHttp().getRequest().user?.${roleClaim};
    const userRoles: unknown[] = Array.isArray(claim) ? claim : [claim];
    if (!userRoles.some((role) => required.includes(role as string))) {
      throw new ForbiddenException(\`Requires role: \${required.join(' or ')}\`);
    }
    return true;
  }
}
`;
}
