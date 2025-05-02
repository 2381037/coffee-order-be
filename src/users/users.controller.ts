// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Req,
  ForbiddenException,
  Query, // <-- Query sudah ada
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiProperty,
  ApiQuery,
} from '@nestjs/swagger'; // <-- ApiQuery sudah ada
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from './entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { UserQueryDto } from './dto/user-query.dto'; // <-- Impor DTO query yang baru

interface RequestWithUser extends Request {
  user: JwtPayloadDto;
}

// Anda bisa pindahkan UserResponseDto ke file dto terpisah nanti
class UserResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty() created_at: Date;
  @ApiProperty() updated_at: Date;
}

// Tipe data untuk respons paginasi di Swagger
class PaginatedUserResponse {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];
  @ApiProperty({ example: 100 })
  total: number;
  @ApiProperty({ example: 1 })
  page: number;
  @ApiProperty({ example: 10 })
  limit: number;
}

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Endpoint POST /users (tetap sama)
  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create user (Admin Only)' })
  @ApiResponse({
    status: 201,
    description: 'User created.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  // FIX: Ubah endpoint GET /users
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin Only)' })
  @ApiQuery({ type: UserQueryDto }) // Gunakan DTO query yang benar
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users.',
    type: PaginatedUserResponse,
  }) // Gunakan tipe respons paginasi
  findAll(
    @Query() queryDto: UserQueryDto, // Terima DTO query
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    // Return tipe paginasi
    return this.usersService.findAll(queryDto); // Panggil service dengan DTO
  }

  // Endpoint GET /users/profile (tetap sama)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile.',
    type: UserResponseDto,
  })
  async getProfile(@Req() req: RequestWithUser): Promise<User> {
    const userId = req.user.userId;
    return this.usersService.findById(userId);
  }

  // Endpoint GET /users/:id (tetap sama)
  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin Only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'User data.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  // Endpoint PATCH /users/profile (tetap sama)
  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated.',
    type: UserResponseDto,
  })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    // ... (logika validasi tetap sama) ...
    const userId = req.user.userId;
    if (
      'role' in updateUserDto ||
      'email' in updateUserDto ||
      ('password' in updateUserDto && updateUserDto.password)
    ) {
      throw new ForbiddenException(
        'Cannot update role, email, or password via this endpoint.',
      );
    }
    return this.usersService.update(userId, updateUserDto);
  }

  // Endpoint PATCH /users/:id (tetap sama)
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID (Admin Only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'User updated.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  // Endpoint DELETE /users/:id (tetap sama)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID (Admin Only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'User deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}
