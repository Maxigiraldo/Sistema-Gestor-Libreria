import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { Shipping } from './shipping.entity';
import { ShippingHistory } from './shipping-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipping, ShippingHistory])],
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}