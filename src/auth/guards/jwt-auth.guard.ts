import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'; // Import the decorator metadata key

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public using the @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Method-level decorator
      context.getClass(), // Class-level decorator
    ]);

    if (isPublic) {
      return true; // Allow access to public routes without JWT check
    }

    // For non-public routes, proceed with JWT validation using Passport's 'jwt' strategy
    return super.canActivate(context);
  }

  // Optional: Customize the handling of authentication errors
  handleRequest(err, user, info) {
    if (err || !user) {
      // You can customize the error message or status code here
      throw (
        err ||
        new UnauthorizedException(info?.message || 'Invalid or missing token')
      );
    }
    return user; // Return the validated user object (payload from jwt.strategy.ts)
  }
}
