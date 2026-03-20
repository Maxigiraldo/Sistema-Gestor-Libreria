import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('client_profiles')
export class ClientProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  dni: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  birthDate: Date;

  @Column({ nullable: true })
  birthPlace: string;

  @Column({ nullable: true })
  shippingAddress: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ default: false })
  subscribedToNews: boolean;

  @CreateDateColumn()
  createdAt: Date;
}