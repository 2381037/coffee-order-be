import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayloadDto } from '../dto/jwt-payload.dto'; // Assuming payload structure

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [
        context.getHandler(), // Method level
        context.getClass(), // Class level
      ],
    );

    // If no @Roles() decorator is used, allow access (or deny by default, depending on policy)
    if (!requiredRoles) {
      return true; // Or false if you want explicit role declaration everywhere
    }

    // Get the user object attached by JwtAuthGuard (from the validated token payload)
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayloadDto; // Cast to your payload type

    // If user is not attached (e.g., JwtAuthGuard didn't run or failed), deny access
    if (!user || !user.role) {
      // This shouldn't typically happen if JwtAuthGuard runs first and requires a valid token
      // console.error("RolesGuard: User or user role not found on request object.");
      throw new ForbiddenException(
        'Access Denied: User role information missing.',
      );
    }

    // Check if the user's role is included in the required roles
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access Denied: Role '${user.role}' is not authorized.`,
      );
    }

    return true; // User has one of the required roles
  }
}
