import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd',
    description: 'Minimum 8 characters',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  // Optionally allow setting role during registration (e.g., by an admin)
  // Remove if users should always default to 'customer'
  @ApiProperty({
    enum: UserRole,
    example: UserRole.CUSTOMER,
    required: false,
    default: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.CUSTOMER;
}
