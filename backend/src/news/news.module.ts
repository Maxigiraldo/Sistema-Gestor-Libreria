import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { Book } from '../books/book.entity';
import { ClientProfile } from '../users/client-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, ClientProfile])],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
