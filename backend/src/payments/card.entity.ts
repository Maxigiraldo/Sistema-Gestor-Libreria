import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum CardType {
  CREDIT = 'credito',
  DEBIT = 'debito',
}

@Entity('payment_cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn()
  client: User;

  @Column({
    type: 'enum',
    enum: CardType,
  })
  type: CardType;

  @Column()
  gatewayToken: string;

  @Column({ length: 4 })
  lastDigits: string;

  @Column()
  brand: string;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}