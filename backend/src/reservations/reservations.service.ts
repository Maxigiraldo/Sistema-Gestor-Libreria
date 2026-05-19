import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Reservation, ReservationStatus } from './reservation.entity';
import { ReservationItem } from './reservation-item.entity';
import { Exemplar } from '../exemplars/exemplar.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationItem)
    private reservationItemRepository: Repository<ReservationItem>,
    @InjectRepository(Exemplar)
    private exemplarRepository: Repository<Exemplar>,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: number) {
    const { exemplarIds } = createReservationDto;

    // Verificar límite de 5 libros distintos
    if (exemplarIds.length > 5) {
      throw new BadRequestException(
        'No puedes reservar más de 5 libros distintos',
      );
    }

    // Verificar que los ejemplares existen y están disponibles
    const exemplars = await Promise.all(
      exemplarIds.map(async (id) => {
        const exemplar = await this.exemplarRepository.findOne({
          where: { id, available: true },
          relations: ['book'],
        });
        if (!exemplar) {
          throw new NotFoundException(
            `Ejemplar ${id} no disponible`,
          );
        }
        return exemplar;
      }),
    );

    // Verificar máximo 3 del mismo libro
    const bookCount: Record<number, number> = {};
    for (const exemplar of exemplars) {
      const bookId = exemplar.book.id;
      bookCount[bookId] = (bookCount[bookId] || 0) + 1;
      if (bookCount[bookId] > 3) {
        throw new BadRequestException(
          'No puedes reservar más de 3 ejemplares del mismo libro',
        );
      }
    }

    // Crear reserva con vencimiento de 24 horas
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const reservation = this.reservationRepository.create({
      client: { id: userId },
      expiresAt,
      status: ReservationStatus.ACTIVE,
    });
    const savedReservation = await this.reservationRepository.save(reservation);

    // Crear items y marcar ejemplares como no disponibles
    for (const exemplar of exemplars) {
      const item = this.reservationItemRepository.create({
        reservation: savedReservation,
        exemplar,
        quantity: 1,
      });
      await this.reservationItemRepository.save(item);
      exemplar.available = false;
      await this.exemplarRepository.save(exemplar);
    }

    return {
      message: 'Reserva creada exitosamente',
      reservation: savedReservation,
      expiresAt,
    };
  }

  async findByUser(userId: number) {
    return this.reservationRepository.find({
      where: { client: { id: userId } },
      relations: ['items', 'items.exemplar', 'items.exemplar.book'],
    });
  }

  async cancel(id: number, userId: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { id, client: { id: userId } },
      relations: ['items', 'items.exemplar'],
    });

    if (!reservation) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Liberar ejemplares
    for (const item of reservation.items) {
      item.exemplar.available = true;
      await this.exemplarRepository.save(item.exemplar);
    }

    reservation.status = ReservationStatus.CANCELLED;
    await this.reservationRepository.save(reservation);

    return { message: 'Reserva cancelada exitosamente' };
  }

  // Cron job cada 30 minutos para liberar reservas vencidas
  @Cron(CronExpression.EVERY_30_MINUTES)
  async releaseExpiredReservations() {
    const now = new Date();
    const expiredReservations = await this.reservationRepository.find({
      where: { status: ReservationStatus.ACTIVE },
      relations: ['items', 'items.exemplar'],
    });

    for (const reservation of expiredReservations) {
      if (reservation.expiresAt <= now) {
        for (const item of reservation.items) {
          item.exemplar.available = true;
          await this.exemplarRepository.save(item.exemplar);
        }
        reservation.status = ReservationStatus.EXPIRED;
        await this.reservationRepository.save(reservation);
      }
    }
  }
}