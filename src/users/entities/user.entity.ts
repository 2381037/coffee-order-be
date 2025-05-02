import { Order } from '../../orders/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true }) // Add index for faster lookups
  @Column({ unique: true })
  email: string;

  // Exclude password hash by default from SELECT queries unless explicitly requested
  @Column({ select: false })
  password_hash: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  // --- Hooks ---
  @BeforeInsert()
  async hashPasswordOnInsert() {
    if (this.password_hash) {
      this.password_hash = await bcrypt.hash(this.password_hash, 10);
    }
  }

  @BeforeUpdate()
  async hashPasswordOnUpdate() {
    // Only hash if password_hash is being changed directly (e.g. during registration or password update)
    // TypeORM might trigger update hooks even if the value isn't changed, so check if it's actually a new plain text password
    // A better approach might be to only set `password_hash` field when you intend to change it,
    // and avoid setting it during regular profile updates.
    // For simplicity here, we re-hash if the field is present. Consider a dedicated password update DTO/method.
    if (this.password_hash && !this.password_hash.startsWith('$2b$')) {
      // Basic check if it looks like a hash already
      this.password_hash = await bcrypt.hash(this.password_hash, 10);
    }
  }

  // --- Methods ---
  async validatePassword(plainPassword: string): Promise<boolean> {
    if (!this.password_hash) return false; // Should not happen if user exists
    return bcrypt.compare(plainPassword, this.password_hash);
  }
}
