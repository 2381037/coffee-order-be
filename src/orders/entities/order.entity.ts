import { User } from '../../users/entities/user.entity';
import { OrderDetail } from './order-detail.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'Pending', // Order placed, awaiting processing/payment
  PROCESSING = 'Processing', // Order confirmed, being prepared
  COMPLETED = 'Completed', // Order fulfilled and delivered/picked up
  CANCELLED = 'Cancelled', // Order cancelled by user or admin
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Index() // Index user_id for faster lookups of user's orders
  @Column()
  user_id: number;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL', // Or 'CASCADE' if orders should be deleted with user
    nullable: false, // An order must belong to a user
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  order_date: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // Total price calculated based on order details
  @Column('decimal', { precision: 10, scale: 2, default: 0.0 })
  total_price: number;

  @UpdateDateColumn()
  updated_at: Date;

  // Cascade allows saving/updating/deleting details when order is saved/updated/deleted
  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, {
    cascade: true, // Save OrderDetails when saving Order
    eager: false, // Load details explicitly when needed using relations option
  })
  orderDetails: OrderDetail[];
}
