import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { Book } from '../books/book.entity';
import { ClientProfile } from '../users/client-profile.entity';
import { OrderDetail } from '../orders/order-detail.entity';
import { ReservationItem } from '../reservations/reservation-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, ClientProfile, OrderDetail, ReservationItem])],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
