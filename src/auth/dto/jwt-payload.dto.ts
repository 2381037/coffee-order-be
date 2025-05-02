// src/auth/dto/jwt-payload.dto.ts
import { UserRole } from '../../users/entities/user.entity';

export class JwtPayloadDto {
  // FIX: Changed 'sub' to 'userId' for consistency with strategy and controllers
  userId: number;
  email: string;
  role: UserRole;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}
