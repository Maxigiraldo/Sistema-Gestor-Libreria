import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { OrderDetail } from './order-detail.entity';
import { Exemplar } from '../exemplars/exemplar.entity';
import { Reservation } from '../reservations/reservation.entity';
import { ReservationItem } from '../reservations/reservation-item.entity';
import { ShippingModule } from '../shipping/shipping.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail, Exemplar, Reservation, ReservationItem]),
    ShippingModule,
    PaymentsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
