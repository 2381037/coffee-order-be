import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Smith' })
  @IsString()
  @IsOptional()
  name?: string;

  // Generally, don't allow email/password/role changes via a generic update DTO.
  // Create specific DTOs/endpoints for those actions if needed.

  // Example: Allow admin to change role (remove if not needed)
  // @ApiPropertyOptional({ enum: UserRole, example: UserRole.CUSTOMER })
  // @IsEnum(UserRole)
  // @IsOptional()
  // role?: UserRole;
}
