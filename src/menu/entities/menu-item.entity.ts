import { OrderDetail } from '../../orders/entities/order-detail.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum MenuItemCategory {
  HOT = 'Hot',
  COLD = 'Cold',
  FOOD = 'Food',
  OTHER = 'Other',
}

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2, comment: 'Price per item' })
  price: number;

  @Column({
    type: 'enum',
    enum: MenuItemCategory,
    default: MenuItemCategory.OTHER,
  })
  category: MenuItemCategory;

  @Column({ default: true })
  is_available: boolean;

  @Column({ nullable: true })
  image_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.menuItem)
  orderDetails: OrderDetail[];
}
