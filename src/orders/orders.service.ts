import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderDetail } from './order-detail.entity';
import { Exemplar } from '../exemplars/exemplar.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private orderDetailRepository: Repository<OrderDetail>,
    @InjectRepository(Exemplar)
    private exemplarRepository: Repository<Exemplar>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: number) {
    const { exemplarIds, deliveryType, shippingAddress } = createOrderDto;

    // Verificar ejemplares disponibles
    const exemplars = await Promise.all(
      exemplarIds.map(async (id) => {
        const exemplar = await this.exemplarRepository.findOne({
          where: { id, available: true },
          relations: ['book'],
        });
        if (!exemplar) {
          throw new NotFoundException(`Ejemplar ${id} no disponible`);
        }
        return exemplar;
      }),
    );

    // Calcular total
    const total = exemplars.reduce((sum, e) => sum + Number(e.book.price), 0);

    // Crear orden
    const order = this.orderRepository.create({
      client: { id: userId },
      total,
      deliveryType,
      shippingAddress,
      status: OrderStatus.CONFIRMED,
    });
    const savedOrder = await this.orderRepository.save(order);

    // Crear detalles y marcar ejemplares como no disponibles
    for (const exemplar of exemplars) {
      const detail = this.orderDetailRepository.create({
        order: savedOrder,
        exemplar,
        quantity: 1,
        unitPrice: exemplar.book.price,
        subtotal: exemplar.book.price,
      });
      await this.orderDetailRepository.save(detail);
      exemplar.available = false;
      await this.exemplarRepository.save(exemplar);
    }

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

    // Liberar ejemplares
    for (const detail of order.details) {
      detail.exemplar.available = true;
      await this.exemplarRepository.save(detail.exemplar);
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    return { message: 'Orden cancelada exitosamente' };
  }
}