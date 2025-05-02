// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { JwtPayloadDto } from './dto/jwt-payload.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email, true);
    if (user && (await user.validatePassword(pass))) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayloadDto = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    try {
      const accessToken = await this.jwtService.signAsync(payload);
      return {
        access_token: accessToken,
      };
    } catch (error) {
      this.logger.error(
        `Failed to sign JWT for user ${user.email}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not process login.');
    }
  }

  async register(registerDto: RegisterDto): Promise<User> {
    // Check if user already exists first
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // FIX: Directly pass the registerDto to the usersService.create method.
    // The usersService.create method now handles creating the entity and saving.
    // RegisterDto has the necessary 'password' field that CreateUserDto expects.
    try {
      // Assuming CreateUserDto and RegisterDto are structurally compatible
      // (both have email, name, password, optional role)
      const savedUser = await this.usersService.create(registerDto);
      return savedUser; // create service already returns user without hash
    } catch (error) {
      // Error handling (like unique constraint) is now primarily in usersService.create,
      // but we can catch re-thrown specific errors here if needed.
      this.logger.error(
        `Registration failed for ${registerDto.email}`,
        error.stack,
      );
      // Re-throw the specific error caught from the service or a generic one
      if (
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      // Fallback error
      throw new InternalServerErrorException(
        'Could not complete registration.',
      );
    }
  }
}
