import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { OrderDetail } from './order-detail.entity';

export enum OrderStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum DeliveryType {
  HOME = 'home_delivery',
  STORE = 'store_pickup',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn()
  client: User;

  @OneToMany(() => OrderDetail, (detail) => detail.order)
  details: OrderDetail[];

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CONFIRMED,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.HOME,
  })
  deliveryType: DeliveryType;

  @Column({ nullable: true })
  shippingAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}