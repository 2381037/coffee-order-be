import { MenuItem } from '../../menu/entities/menu-item.entity';
import { Order } from './order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @ManyToOne(() => Order, (order) => order.orderDetails, {
    onDelete: 'CASCADE', // If order is deleted, delete details
    nullable: false,
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column()
  menu_item_id: number;

  // Prevent deleting a menu item if it's part of an order? Or SET NULL?
  @ManyToOne(() => MenuItem, (menuItem) => menuItem.orderDetails, {
    onDelete: 'SET NULL', // Set menu_item_id to NULL if MenuItem is deleted
    nullable: true, // Allow NULL if menu item is deleted
    eager: false, // Load menu item info explicitly when needed
  })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem: MenuItem | null; // Relation can be null if item deleted

  @Column({ type: 'int' })
  quantity: number;

  // Store the price *at the time of order* to prevent changes if menu price updates later
  @Column('decimal', { precision: 10, scale: 2 })
  price_per_item: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    comment: 'quantity * price_per_item',
  })
  subtotal: number; // Calculated field, potentially set before saving
}
