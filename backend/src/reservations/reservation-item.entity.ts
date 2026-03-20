import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';
import { Exemplar } from '../exemplars/exemplar.entity';

@Entity('reservation_items')
export class ReservationItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Reservation)
  @JoinColumn()
  reservation: Reservation;

  @ManyToOne(() => Exemplar)
  @JoinColumn()
  exemplar: Exemplar;

  @Column({ default: 1 })
  quantity: number;
}