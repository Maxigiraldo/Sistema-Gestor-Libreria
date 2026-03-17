import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { Reservation } from './reservation.entity';
import { ReservationItem } from './reservation-item.entity';
import { Exemplar } from '../exemplars/exemplar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationItem, Exemplar]),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}