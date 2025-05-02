// src/orders/orders.controller.ts
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
  Query,
  HttpCode,
  HttpStatus,
  Logger, // <-- Impor Logger
} from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiProperty,
} from '@nestjs/swagger'; // Impor ApiProperty jika PaginatedResponse didefinisikan di sini
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { Order } from './entities/order.entity';

// --- Definisikan tipe PaginatedResponse jika belum ada secara global ---
// (Lebih baik diletakkan di file terpisah misal src/types/pagination.dto.ts)
// Atau impor dari '../types' jika sudah ada di sana
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// --- Swagger Response Type untuk Paginasi Order ---
// (Juga lebih baik di file DTO terpisah)
class OrderResponseForSwagger extends Order {
  // Anda bisa override atau tambahkan properti khusus Swagger di sini jika perlu
  // Atau gunakan OmitType/PickType dari @nestjs/swagger jika ingin spesifik
}
class PaginatedOrderResponse {
  @ApiProperty({ type: [OrderResponseForSwagger] }) // Gunakan tipe Order yang mungkin dimodifikasi untuk Swagger
  data: OrderResponseForSwagger[];
  @ApiProperty({ example: 50, description: 'Total number of items found' })
  total: number;
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;
  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;
}
// -----------------------------------------------------------------------

interface RequestWithUser extends Request {
  user: JwtPayloadDto;
}

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('orders')
export class OrdersController {
  // Tambahkan logger
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order (Customer Only)' })
  @ApiResponse({ status: 201, description: 'Order created.', type: Order }) // Tipe respons bisa lebih spesifik jika perlu
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(
    @Req() req: RequestWithUser,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const userId = req.user.userId;
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get orders (Admin: All/filtered, Customer: Own)' })
  @ApiQuery({ type: OrderQueryDto })
  // FIX: Gunakan tipe respons paginasi yang benar untuk Swagger
  @ApiResponse({
    status: 200,
    description: 'List of orders.',
    type: PaginatedOrderResponse,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  // FIX: Ubah tipe return promise agar eksplisit PaginatedResponse
  async findAll(
    @Req() req: RequestWithUser,
    @Query() queryDto: OrderQueryDto,
  ): Promise<PaginatedResponse<Order>> {
    // <-- Gunakan tipe PaginatedResponse<Order>
    const currentUser = { userId: req.user.userId, role: req.user.role };
    this.logger.log(
      `Fetching orders for user ${currentUser.userId} (Role: ${currentUser.role}) with query: ${JSON.stringify(queryDto)}`,
    );
    try {
      // Panggil service, yang seharusnya mengembalikan format paginasi
      const result = await this.ordersService.findAll(currentUser, queryDto);

      // FIX: Lakukan double check struktur sebelum return
      // Ini memastikan controller *selalu* mengembalikan format yang diharapkan frontend
      if (
        result &&
        Array.isArray(result.data) &&
        typeof result.total === 'number' &&
        typeof result.page === 'number' &&
        typeof result.limit === 'number'
      ) {
        this.logger.log(
          `Successfully fetched ${result.data.length} orders out of ${result.total}`,
        );
        return result; // Kembalikan hasil jika struktur valid
      } else {
        // Log error jika service tidak mengembalikan format yang benar
        this.logger.error(
          `OrdersService.findAll returned invalid structure: ${JSON.stringify(result)}`,
        );
        // Kembalikan struktur default yang valid tapi kosong agar frontend tidak error
        return {
          data: [],
          total: 0,
          page: queryDto.page || 1,
          limit: queryDto.limit || 10,
        };
      }
    } catch (error) {
      this.logger.error(
        `Error in findAll orders controller for user ${currentUser.userId}: ${error.message}`,
        error.stack,
      );
      // Lempar ulang error agar NestJS menangani (akan jadi 500 atau error spesifik jika dilempar dari service)
      throw error;
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get order by ID (Admin: Any, Customer: Own)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Order details.', type: Order }) // Tipe respons bisa lebih spesifik
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  findOne(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.ordersService.findOne(id, req.user.userId, isAdmin, true);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin Only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Status updated.', type: Order }) // Tipe respons bisa lebih spesifik
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cancel a pending order (Customer Only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Order cancelled.', type: Order }) // Tipe respons bisa lebih spesifik
  @ApiResponse({ status: 400, description: 'Cannot cancel.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  cancelOrder(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    const userId = req.user.userId;
    return this.ordersService.cancelOrder(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an order (Admin Only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Order deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Not found.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.ordersService.remove(id);
  }
}
