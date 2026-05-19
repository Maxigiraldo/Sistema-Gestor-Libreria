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
    const where: any = { active: true };

    if (query.title)         where.title     = ILike(`%${query.title}%`);
    if (query.author)        where.author    = ILike(`%${query.author}%`);
    if (query.genre) where.genre = query.genre;
    if (query.publisher)     where.publisher = ILike(`%${query.publisher}%`);
    if (query.issn)          where.issn      = ILike(`%${query.issn}%`);
    if (query.language)      where.language  = ILike(`%${query.language}%`);
    if (query.condition)     where.condition = query.condition;
    if (query.publicationYear) where.publicationYear = query.publicationYear;

    // ── Fix precio ──────────────────────────────────────────────
    const min = query.minPrice !== undefined ? Number(query.minPrice) : null;
    const max = query.maxPrice !== undefined ? Number(query.maxPrice) : null;

    if (min !== null && max !== null) {
      where.price = Between(min, max);
    } else if (min !== null) {
      where.price = Between(min, 9_999_999);
    } else if (max !== null) {
      where.price = Between(0, max);
    }
    // ────────────────────────────────────────────────────────────

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