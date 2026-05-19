import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { OrderDetail } from './order-detail.entity';
import { Exemplar } from '../exemplars/exemplar.entity';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail, Exemplar]),
    ShippingModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}