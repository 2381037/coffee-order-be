import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { MenuModule } from '../menu/menu.module'; // Import MenuModule to access MenuService/Items

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail]), // Register Order and OrderDetail entities
    MenuModule, // Make MenuService available for price checking etc.
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
