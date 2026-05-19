import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('account_balances')
export class Balance {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  client: User;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  available: number;

  @UpdateDateColumn()
  updatedAt: Date;
}