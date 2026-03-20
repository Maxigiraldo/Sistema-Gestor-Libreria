import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { Return } from './return.entity';
import { Shipping } from '../shipping/shipping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Return, Shipping])],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}