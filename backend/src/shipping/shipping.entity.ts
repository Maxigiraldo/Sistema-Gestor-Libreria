import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';

export enum ShippingStatus {
  PREPARING = 'en_preparacion',
  SHIPPED = 'enviado',
  DELIVERED = 'entregado',
}

export enum ShippingType {
  HOME = 'domicilio',
  STORE = 'recogida_tienda',
}

@Entity('shippings')
export class Shipping {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order)
  @JoinColumn()
  order: Order;

  @Column({ nullable: true })
  destinationAddress: string;

  @Column({
    type: 'enum',
    enum: ShippingType,
    default: ShippingType.HOME,
  })
  type: ShippingType;

  @Column({
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.PREPARING,
  })
  status: ShippingStatus;

  @Column({ nullable: true, type: 'date' })
  estimatedDelivery: Date;

  @Column({ nullable: true, type: 'date' })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}