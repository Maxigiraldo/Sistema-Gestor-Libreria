import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { Return } from './return.entity';
import { Shipping } from '../shipping/shipping.entity';
import { MailModule } from '../mail/mail.module';
import { User } from '../users/user.entity';
import { Balance } from '../payments/balance.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Return, Shipping, User, Balance, Order]), MailModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}