import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { ClientProfile } from '../users/client-profile.entity';
import { OrderDetail } from '../orders/order-detail.entity';
import { ReservationItem } from '../reservations/reservation-item.entity';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Book)
    private bookRepo: Repository<Book>,
    @InjectRepository(ClientProfile)
    private profileRepo: Repository<ClientProfile>,
    @InjectRepository(OrderDetail)
    private orderDetailRepo: Repository<OrderDetail>,
    @InjectRepository(ReservationItem)
    private reservationItemRepo: Repository<ReservationItem>,
  ) {}

  async forBook(bookId: number, userId?: number): Promise<Book[]> {
    const book = await this.bookRepo.findOne({
      where: { id: bookId },
      relations: ['exemplars'],
    });
    if (!book) return [];

    let genres: string[] = book.genre ? [book.genre] : [];
    if (userId) {
      const profile = await this.profileRepo.findOne({
        where: { user: { id: userId } },
      });
      if (profile?.favoriteGenres?.length) {
        genres = [...new Set([...profile.favoriteGenres, ...genres])];
      }
    }

    return this.fetchByGenres(genres, [bookId], 3);
  }

  async forMe(userId: number): Promise<Book[]> {
    // Géneros de compras (Order → OrderDetail → Exemplar → Book)
    const orderDetails = await this.orderDetailRepo.find({
      where: { order: { client: { id: userId } } },
      relations: ['exemplar', 'exemplar.book', 'order', 'order.client'],
    });
    const purchasedBookIds = orderDetails.map((d) => d.exemplar?.book?.id).filter(Boolean);
    const purchasedGenres = orderDetails.map((d) => d.exemplar?.book?.genre).filter(Boolean);

    // Géneros de reservas (Reservation → ReservationItem → Exemplar → Book)
    const reservationItems = await this.reservationItemRepo.find({
      where: { reservation: { client: { id: userId } } },
      relations: ['exemplar', 'exemplar.book', 'reservation', 'reservation.client'],
    });
    const reservedBookIds = reservationItems.map((i) => i.exemplar?.book?.id).filter(Boolean);
    const reservedGenres = reservationItems.map((i) => i.exemplar?.book?.genre).filter(Boolean);

    // Géneros favoritos del perfil
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
    });
    const favoriteGenres = profile?.favoriteGenres ?? [];

    // Unir géneros priorizando historial (los más frecuentes primero)
    const genreFreq: Record<string, number> = {};
    for (const g of [...purchasedGenres, ...reservedGenres]) {
      if (g) genreFreq[g] = (genreFreq[g] ?? 0) + 1;
    }
    for (const g of favoriteGenres) {
      genreFreq[g] = (genreFreq[g] ?? 0) + 0.5;
    }

    const genres = Object.entries(genreFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g);

    const excludeIds = [...new Set([...purchasedBookIds, ...reservedBookIds])].filter(Boolean) as number[];

    // Si no hay historial, devolver libros populares (disponibles)
    if (!genres.length) return this.fetchByGenres([], excludeIds, 6);

    return this.fetchByGenres(genres, excludeIds, 6);
  }

  private async fetchByGenres(genres: string[], excludeIds: number[], limit: number): Promise<Book[]> {
    const results: Book[] = [];

    if (genres.length) {
      const byGenre = await this.bookRepo
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.exemplars', 'exemplar')
        .where('book.active = true')
        .andWhere(excludeIds.length ? 'book.id NOT IN (:...excludeIds)' : '1=1', { excludeIds: excludeIds.length ? excludeIds : [0] })
        .andWhere('book.genre IN (:...genres)', { genres })
        .andWhere('exemplar.available = true')
        .orderBy('RANDOM()')
        .limit(limit)
        .getMany();

      results.push(...byGenre);
    }

    if (results.length < limit) {
      const allExcluded = [...excludeIds, ...results.map((b) => b.id)];
      const filler = await this.bookRepo
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.exemplars', 'exemplar')
        .where('book.active = true')
        .andWhere(allExcluded.length ? 'book.id NOT IN (:...ids)' : '1=1', { ids: allExcluded.length ? allExcluded : [0] })
        .andWhere('exemplar.available = true')
        .orderBy('RANDOM()')
        .limit(limit - results.length)
        .getMany();

      results.push(...filler);
    }

    return results.slice(0, limit);
  }
}
