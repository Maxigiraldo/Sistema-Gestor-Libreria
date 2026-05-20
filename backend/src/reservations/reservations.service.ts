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

  async addToCart(exemplarId: number, userId: number) {
    const exemplar = await this.exemplarRepository.findOne({
      where: { id: exemplarId, available: true },
      relations: ['book'],
    });
    if (!exemplar) {
      throw new NotFoundException('Ejemplar no disponible');
    }

    let reservation = await this.reservationRepository.findOne({
      where: { client: { id: userId }, status: ReservationStatus.ACTIVE },
      relations: ['items', 'items.exemplar', 'items.exemplar.book'],
    });

    if (reservation) {
      const alreadyInCart = reservation.items.some(i => i.exemplar.id === exemplarId);
      if (alreadyInCart) {
        throw new BadRequestException('Este ejemplar ya está en tu carrito');
      }

      const bookIds = new Set(reservation.items.map(i => i.exemplar.book.id));
      bookIds.add(exemplar.book.id);
      if (bookIds.size > 5) {
        throw new BadRequestException('No puedes tener más de 5 libros distintos en el carrito');
      }

      const sameBookCount = reservation.items.filter(i => i.exemplar.book.id === exemplar.book.id).length;
      if (sameBookCount >= 3) {
        throw new BadRequestException('No puedes tener más de 3 ejemplares del mismo libro en el carrito');
      }

      reservation.expiresAt = new Date();
      reservation.expiresAt.setHours(reservation.expiresAt.getHours() + 24);
      await this.reservationRepository.save(reservation);
    } else {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      reservation = this.reservationRepository.create({
        client: { id: userId },
        expiresAt,
        status: ReservationStatus.ACTIVE,
      });
      reservation = await this.reservationRepository.save(reservation);
    }

    const item = this.reservationItemRepository.create({ reservation, exemplar, quantity: 1 });
    await this.reservationItemRepository.save(item);
    exemplar.available = false;
    await this.exemplarRepository.save(exemplar);

    return { message: 'Libro agregado al carrito', reservationId: reservation.id };
  }

  async removeFromCart(exemplarId: number, userId: number) {
    const reservation = await this.reservationRepository.findOne({
      where: { client: { id: userId }, status: ReservationStatus.ACTIVE },
      relations: ['items', 'items.exemplar'],
    });

    if (!reservation) {
      throw new NotFoundException('No tienes un carrito activo');
    }

    const item = reservation.items.find(i => i.exemplar.id === exemplarId);
    if (!item) {
      throw new NotFoundException('Este ejemplar no está en tu carrito');
    }

    item.exemplar.available = true;
    await this.exemplarRepository.save(item.exemplar);
    await this.reservationItemRepository.remove(item);

    if (reservation.items.length <= 1) {
      reservation.status = ReservationStatus.CANCELLED;
      await this.reservationRepository.save(reservation);
    }

    return { message: 'Libro eliminado del carrito' };
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