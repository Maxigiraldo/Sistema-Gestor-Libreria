import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { ClientProfile } from '../users/client-profile.entity';

const NEW_BOOK_DAYS = 30;

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(Book) private bookRepo: Repository<Book>,
    @InjectRepository(ClientProfile) private profileRepo: Repository<ClientProfile>,
  ) {}

  async getSubscription(userId: number): Promise<boolean> {
    const profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    return profile?.subscribedToNews ?? false;
  }

  async setSubscription(userId: number, subscribe: boolean): Promise<void> {
    await this.profileRepo.update({ user: { id: userId } }, { subscribedToNews: subscribe });
  }

  async getNewBooks(userId: number): Promise<Book[]> {
    const profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile?.subscribedToNews) return [];

    const genres = profile.favoriteGenres ?? [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NEW_BOOK_DAYS);

    const qb = this.bookRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.exemplars', 'exemplar')
      .where('book.active = :active', { active: true })
      .andWhere('book.createdAt >= :cutoff', { cutoff });

    if (genres.length > 0) {
      qb.andWhere('book.genre IN (:...genres)', { genres });
    }

    return qb.orderBy('book.createdAt', 'DESC').getMany();
  }

  async getNewBookIds(userId: number): Promise<number[]> {
    const profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile?.subscribedToNews) return [];

    const genres = profile.favoriteGenres ?? [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - NEW_BOOK_DAYS);

    const qb = this.bookRepo
      .createQueryBuilder('book')
      .select('book.id', 'id')
      .where('book.active = :active', { active: true })
      .andWhere('book.createdAt >= :cutoff', { cutoff });

    if (genres.length > 0) {
      qb.andWhere('book.genre IN (:...genres)', { genres });
    }

    const rows = await qb.getRawMany<{ id: number }>();
    return rows.map((r) => Number(r.id));
  }
}
