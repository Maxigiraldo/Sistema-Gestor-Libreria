import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';

export enum ReturnStatus {
  PENDING = 'pendiente',
  APPROVED = 'aprobada',
  REJECTED = 'rechazada',
  COMPLETED = 'completada',
}

export enum ReturnCause {
  BAD_CONDITION = 'mal_estado',
  NO_EXPECTATIONS = 'no_expectativas',
  LATE_DELIVERY = 'demora_entrega',
}

@Entity('returns')
export class Return {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order)
  @JoinColumn()
  order: Order;

  @ManyToOne(() => User)
  @JoinColumn()
  client: User;

  @Column({
    type: 'enum',
    enum: ReturnCause,
  })
  cause: ReturnCause;

  @Column({ nullable: true })
  additionalDescription: string;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ nullable: true, type: 'date' })
  deadlineDate: Date;

  @Column({
    type: 'enum',
    enum: ReturnStatus,
    default: ReturnStatus.PENDING,
  })
  status: ReturnStatus;

  @CreateDateColumn()
  createdAt: Date;
}