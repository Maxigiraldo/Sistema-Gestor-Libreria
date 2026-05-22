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

    // Partial checkout: remove only the purchased items from the reservation.
    // Remaining items stay reserved (ACTIVE). Only mark the reservation CONVERTED
    // when it becomes fully empty.
    if (fromReservation) {
      const purchasedItems = await this.reservationItemRepository.find({
        where: { exemplar: { id: In(exemplarIds) } },
        relations: ['reservation'],
      });

      const affectedReservationIds = [...new Set(purchasedItems.map((i) => i.reservation.id))];

      if (purchasedItems.length > 0) {
        await this.reservationItemRepository.delete({
          id: In(purchasedItems.map((i) => i.id)),
        });
      }

      // Convert only reservations that are now fully empty
      for (const resId of affectedReservationIds) {
        const remaining = await this.reservationItemRepository.count({
          where: { reservation: { id: resId } },
        });
        if (remaining === 0) {
          await this.reservationRepository.update(
            { id: resId, status: ReservationStatus.ACTIVE },
            { status: ReservationStatus.CONVERTED },
          );
        }
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

  async cancel(id: number, userId: number, reason?: string, refundMethod?: 'balance' | 'card') {
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
    order.cancelReason = reason ?? '';
    await this.orderRepository.save(order);

    // Reembolso inmediato a saldo
    if (refundMethod === 'balance') {
      await this.paymentsService.topup(userId, Number(order.total));
      return {
        message: `Pedido cancelado. $${Number(order.total).toLocaleString('es-CO')} reembolsados a tu saldo.`,
        refundMethod,
      };
    }

    // Tarjeta: reembolso simulado (3-5 días hábiles)
    return {
      message: 'Pedido cancelado. El reembolso a tu tarjeta se procesará en 3-5 días hábiles.',
      refundMethod: refundMethod ?? 'card',
    };
  }

  async findAllForAdmin() {
    return this.orderRepository.find({
      relations: ['client', 'details', 'details.exemplar', 'details.exemplar.book'],
      order: { createdAt: 'DESC' },
    });
  }
}
