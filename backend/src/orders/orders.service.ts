import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, DeliveryType } from './order.entity';
import { OrderDetail } from './order-detail.entity';
import { Exemplar } from '../exemplars/exemplar.entity';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { ReservationItem } from '../reservations/reservation-item.entity';
import { CreateOrderDto, CheckoutPaymentMethod } from './dto/create-order.dto';
import { ShippingService } from '../shipping/shipping.service';
import { ShippingType } from '../shipping/shipping.entity';
import { PaymentsService } from '../payments/payments.service';
import { In } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Exemplar)
    private exemplarRepository: Repository<Exemplar>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(ReservationItem)
    private reservationItemRepository: Repository<ReservationItem>,
    private shippingService: ShippingService,
    private paymentsService: PaymentsService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    const {
      exemplarIds,
      deliveryType,
      shippingAddress,
      paymentMethod,
      cardNumber,
      cardHolderName,
      cardExpiry,
      cardType,
      saveCard,
      savedCardId,
      fromReservation,
    } = createOrderDto;

    const exemplars = await Promise.all(
      exemplarIds.map(async (id) => {
        // Desde reserva: el ejemplar ya está bloqueado (available=false), buscar solo por ID
        const where = fromReservation ? { id } : { id, available: true };
        const exemplar = await this.exemplarRepository.findOne({
          where,
          relations: ['book'],
        });
        if (!exemplar) {
          throw new NotFoundException(`Ejemplar ${id} no disponible`);
        }
        return exemplar;
      }),
    );

    const total = exemplars.reduce((sum, e) => sum + Number(e.book.price), 0);

    // Process payment before creating order — throws if payment fails
    await this.paymentsService.processOrderPayment(
      userId,
      total,
      paymentMethod,
      { cardNumber, cardHolderName, cardExpiry, cardType, saveCard },
      savedCardId,
    );

    const order = this.orderRepository.create({
      client: { id: userId },
      total,
      deliveryType,
      shippingAddress,
      status: OrderStatus.CONFIRMED,
    });
    const savedOrder = await this.orderRepository.save(order);

    for (const exemplar of exemplars) {
      const detail = this.orderDetailRepository.create({
        order: savedOrder,
        exemplar,
        quantity: 1,
        unitPrice: exemplar.book.price,
        subtotal: exemplar.book.price,
      });
      await this.orderDetailRepository.save(detail);
      if (!fromReservation) {
        exemplar.available = false;
        await this.exemplarRepository.save(exemplar);
      }
    }

    // Marcar las reservas de estos ejemplares como CONVERTED para que el cron no las libere
    if (fromReservation) {
      const items = await this.reservationItemRepository.find({
        where: { exemplar: { id: In(exemplarIds) } },
        relations: ['reservation'],
      });
      const reservationIds = [...new Set(items.map((i) => i.reservation.id))];
      if (reservationIds.length > 0) {
        await this.reservationRepository.update(
          { id: In(reservationIds), status: ReservationStatus.ACTIVE },
          { status: ReservationStatus.CONVERTED },
        );
      }
    }

    const shippingType =
      deliveryType === DeliveryType.HOME ? ShippingType.HOME : ShippingType.STORE;

    await this.shippingService.create({
      orderId: savedOrder.id,
      type: shippingType,
      destinationAddress: shippingAddress ?? '',
    });

    return {
      message: 'Compra realizada exitosamente',
      order: savedOrder,
      total,
    };
  }

  async findByUser(userId: number) {
    return this.orderRepository.find({
      where: { client: { id: userId } },
      relations: ['details', 'details.exemplar', 'details.exemplar.book'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id, client: { id: userId } },
      relations: ['details', 'details.exemplar', 'details.exemplar.book'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async cancel(id: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id, client: { id: userId } },
      relations: ['details', 'details.exemplar'],
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('La orden ya está cancelada');
    }

    for (const detail of order.details) {
      detail.exemplar.available = true;
      await this.exemplarRepository.save(detail.exemplar);
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    return { message: 'Orden cancelada exitosamente' };
  }
}
