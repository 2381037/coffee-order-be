// src/auth/strategies/jwt.strategy.ts
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// FIX: Ensure StrategyOptions is imported if you were using it for casting, otherwise not needed now
import { ExtractJwt, Strategy /*, StrategyOptions */ } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_SECRET environment variable is not set.',
      );
    }

    // FIX: Removed explicit 'passReqToCallback: false' and the 'as StrategyOptions' cast
    // Let PassportStrategy handle the default value (which is false)
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(
    payload: JwtPayloadDto,
  ): Promise<{ userId: number; email: string; role: string }> {
    if (!payload || !payload.userId) {
      throw new UnauthorizedException('Invalid token payload structure.');
    }
    try {
      // findById now throws if user not found
      await this.usersService.findById(payload.userId);
    } catch (error) {
      // Catch NotFoundException from findById specifically if needed, otherwise generic Unauthorized
      throw new UnauthorizedException(
        'User associated with this token not found.',
      );
    }
    return { userId: payload.userId, email: payload.email, role: payload.role };
  }
}
