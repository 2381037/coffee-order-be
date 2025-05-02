// src/orders/orders.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { MenuService } from '../menu/menu.service';
import { User, UserRole } from '../users/entities/user.entity'; // Import User
import { OrderQueryDto } from './dto/order-query.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    private menuService: MenuService,
    private dataSource: DataSource,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const { orderDetails: detailDtos } = createOrderDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const menuItemIds = detailDtos.map((detail) => detail.menuItemId);
      if (menuItemIds.length === 0) {
        throw new BadRequestException('Order must contain at least one item.');
      }
      const menuItems = await this.menuService.findByIds(menuItemIds);

      let calculatedTotalPrice = 0;
      const orderDetailEntities: OrderDetail[] = [];

      for (const detailDto of detailDtos) {
        const menuItem = menuItems.find(
          (item) => item.id === detailDto.menuItemId,
        );
        if (!menuItem)
          throw new BadRequestException(
            `Menu item ID ${detailDto.menuItemId} not found.`,
          );
        if (!menuItem.is_available)
          throw new BadRequestException(`"${menuItem.name}" is unavailable.`);

        const pricePerItem = menuItem.price;
        const quantity = detailDto.quantity;
        const subtotal = Number((pricePerItem * quantity).toFixed(2));
        calculatedTotalPrice += subtotal;

        const orderDetail = this.orderDetailRepository.create({
          // Use repository's create method
          menu_item_id: menuItem.id,
          quantity: quantity,
          price_per_item: pricePerItem,
          subtotal: subtotal,
        });
        orderDetailEntities.push(orderDetail);
      }

      const order = this.orderRepository.create({
        user_id: userId,
        status: OrderStatus.PENDING,
        total_price: Number(calculatedTotalPrice.toFixed(2)),
        orderDetails: orderDetailEntities,
      });

      const savedOrder = await queryRunner.manager.save(order); // Saves order and cascaded details
      await queryRunner.commitTransaction();

      // Reload to get relations properly populated, especially orderDetails with IDs
      return this.findOne(savedOrder.id, userId, false, true); // Reload as user to ensure correct permissions check
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Order creation failed for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Could not create order.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    currentUser: { userId: number; role: UserRole },
    queryDto: OrderQueryDto,
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    const { status, userId: queryUserId, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user') // Select only needed user fields later if necessary
      .select(['order', 'user.id', 'user.name', 'user.email']) // Select specific fields
      .orderBy('order.order_date', 'DESC');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (currentUser.role === UserRole.ADMIN) {
      if (queryUserId) {
        query.andWhere('order.user_id = :userId', { userId: queryUserId });
      }
    } else {
      query.andWhere('order.user_id = :userId', { userId: currentUser.userId });
      if (queryUserId && queryUserId !== currentUser.userId) {
        throw new ForbiddenException('You can only view your own orders.');
      }
    }

    try {
      query.skip(skip).take(limit);
      const [data, total] = await query.getManyAndCount();
      // Note: Eager relations in Order entity might load details anyway.
      // If details are needed here, add .leftJoinAndSelect('order.orderDetails', 'details') etc.
      return { data, total, page, limit };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve orders for user ${currentUser.userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not retrieve orders.');
    }
  }

  async findOne(
    id: number,
    currentUserId?: number,
    isAdmin: boolean = false,
    loadRelations = true,
  ): Promise<Order> {
    const relationsToLoad = loadRelations
      ? ['user', 'orderDetails', 'orderDetails.menuItem'] // Load details and their menu items
      : ['user']; // Always load user for permission check

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: relationsToLoad,
      select: {
        // Explicitly select user fields to avoid password hash even if 'select: false' fails
        user: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (!isAdmin && currentUserId && order.user_id !== currentUserId) {
      throw new ForbiddenException(
        'You are not authorized to view this order.',
      );
    }

    // FIX: No need for delete operator here because password_hash is excluded by select options above
    // or by 'select: false' on the User entity itself.

    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    // FIX: Ensure findOne used here throws if not found, gets the order as admin
    const order = await this.findOne(id, undefined, true, false); // Find as admin, don't load relations initially

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      if (status !== order.status) {
        throw new BadRequestException(
          `Cannot change status from ${order.status}.`,
        );
      }
    }

    order.status = status;
    try {
      const updatedOrder = await this.orderRepository.save(order);
      // FIX: Reload with relations to return the full updated object
      return this.findOne(updatedOrder.id, undefined, true, true);
    } catch (error) {
      this.logger.error(
        `Failed update status order ${id} to ${status}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not update order status.');
    }
  }

  async cancelOrder(id: number, userId: number): Promise<Order> {
    // FIX: findOne checks ownership and throws if not found/forbidden
    const order = await this.findOne(id, userId, false, false); // Find as user, don't need relations initially

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel order with status ${order.status}.`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    try {
      const updatedOrder = await this.orderRepository.save(order);
      // FIX: Reload with relations to return the full updated object
      return this.findOne(updatedOrder.id, userId, false, true);
    } catch (error) {
      this.logger.error(
        `Failed cancel order ${id} user ${userId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not cancel order.');
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.orderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }
}
