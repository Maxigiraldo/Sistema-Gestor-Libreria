import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Shipping } from './shipping.entity';

@Entity('shipping_history')
export class ShippingHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shipping)
  @JoinColumn()
  shipping: Shipping;

  @Column()
  previousStatus: string;

  @Column()
  newStatus: string;

  @Column({ nullable: true })
  observation: string;

  @CreateDateColumn()
  changedAt: Date;
}