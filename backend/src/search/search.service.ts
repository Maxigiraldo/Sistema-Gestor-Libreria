import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, FindManyOptions } from 'typeorm';
import { Book } from '../books/book.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async search(query: {
    q?: string;
    title?: string;
    author?: string;
    genre?: string;
    publisher?: string;
    issn?: string;
    language?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    publicationYear?: number;
  }) {
    // q → OR search across title, author and genre combined with AND sidebar filters
    if (query.q) {
      const base: any = { active: true };
      if (query.condition) base.condition = query.condition;
      if (query.genre) base.genre = query.genre;
      if (query.minPrice && query.maxPrice) base.price = Between(query.minPrice, query.maxPrice);

      const q = query.q;
      const books = await this.bookRepository.find({
        where: [
          { ...base, title: ILike(`%${q}%`) },
          { ...base, author: ILike(`%${q}%`) },
          { ...base, genre: ILike(`%${q}%`) },
        ],
        relations: ['exemplars'],
      });
      return { total: books.length, results: books };
    }

    const where: any = { active: true };

    if (query.title) where.title = ILike(`%${query.title}%`);
    if (query.author) where.author = ILike(`%${query.author}%`);
    if (query.genre) where.genre = ILike(`%${query.genre}%`);
    if (query.publisher) where.publisher = ILike(`%${query.publisher}%`);
    if (query.issn) where.issn = ILike(`%${query.issn}%`);
    if (query.language) where.language = ILike(`%${query.language}%`);
    if (query.condition) where.condition = query.condition;
    if (query.publicationYear) where.publicationYear = query.publicationYear;
    if (query.minPrice && query.maxPrice) {
      where.price = Between(query.minPrice, query.maxPrice);
    }

    const books = await this.bookRepository.find({
      where,
      relations: ['exemplars'],
    });

    return {
      total: books.length,
      results: books,
    };
  }
}