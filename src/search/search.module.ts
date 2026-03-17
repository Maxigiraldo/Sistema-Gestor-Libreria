import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Book } from '../books/book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}