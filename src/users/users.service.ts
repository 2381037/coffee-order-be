// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ConflictException, // Pastikan ConflictException diimpor
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto'; // <-- Impor DTO query yang baru

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }
    const user = this.usersRepository.create({
      ...createUserDto,
      password_hash: createUserDto.password, // Hook akan hash ini
    });
    try {
      const savedUser = await this.usersRepository.save(user);
      const { password_hash, ...result } = savedUser;
      return result as User;
    } catch (error) {
      this.logger.error(
        `Error creating user: ${createUserDto.email}`,
        error.stack,
      );
      if (error.code === '23505') {
        throw new ConflictException('Email already exists.');
      }
      throw new InternalServerErrorException('Could not create user.');
    }
  }

  // FIX: Ubah metode findAll untuk menerima UserQueryDto dan return struktur paginasi
  async findAll(
    queryDto: UserQueryDto,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { role, page = 1, limit = 10 } = queryDto; // Ambil nilai dari DTO
    const skip = (page - 1) * limit;

    const query = this.usersRepository
      .createQueryBuilder('user')
      .select([
        // Pilih kolom yang aman
        'user.id',
        'user.email',
        'user.name',
        'user.role',
        'user.created_at',
        'user.updated_at',
      ])
      .orderBy('user.name', 'ASC'); // Contoh sorting

    if (role) {
      // Filter berdasarkan role jika ada
      query.andWhere('user.role = :role', { role });
    }
    // Tambahkan filter lain di sini jika perlu (misal search)
    // if (queryDto.search) {
    //     query.andWhere('(user.name ILIKE :search OR user.email ILIKE :search)', { search: `%${queryDto.search}%` });
    // }

    try {
      query.skip(skip).take(limit); // Terapkan pagination
      const [data, total] = await query.getManyAndCount(); // Ambil data dan total count
      return { data, total, page, limit }; // Kembalikan objek paginasi
    } catch (error) {
      this.logger.error(
        `Failed to retrieve users with query: ${JSON.stringify(queryDto)}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not retrieve users.');
    }
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'created_at', 'updated_at'], // Tanpa password
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email });
    if (includePassword) {
      queryBuilder.addSelect('user.password_hash');
    } else {
      queryBuilder.select([
        'id',
        'email',
        'name',
        'role',
        'created_at',
        'updated_at',
      ]);
    }
    return queryBuilder.getOne();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id); // Throws jika tidak ditemukan
    if ('password' in updateUserDto) {
      this.logger.warn(
        `Attempted to update password via generic update for user ID ${id}. Ignoring.`,
      );
      delete (updateUserDto as any).password;
    }
    this.usersRepository.merge(user, updateUserDto);
    try {
      const updatedUser = await this.usersRepository.save(user);
      const { password_hash, ...result } = updatedUser;
      return result as User;
    } catch (error) {
      this.logger.error(`Error updating user ID ${id}`, error.stack);
      if (error.code === '23505') {
        throw new ConflictException(
          'Update failed due to unique constraint violation.',
        );
      }
      throw new InternalServerErrorException('Could not update user.');
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }
}
