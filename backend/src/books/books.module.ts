import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book } from './book.entity';
import { Exemplar } from '../exemplars/exemplar.entity';
import { ReservationItem } from '../reservations/reservation-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Exemplar, ReservationItem])],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}