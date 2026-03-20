import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping, ShippingStatus } from './shipping.entity';
import { ShippingHistory } from './shipping-history.entity';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
    @InjectRepository(ShippingHistory)
    private historyRepository: Repository<ShippingHistory>,
  ) {}

  async create(createShippingDto: CreateShippingDto) {
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const shipping = this.shippingRepository.create({
      order: { id: createShippingDto.orderId },
      type: createShippingDto.type,
      destinationAddress: createShippingDto.destinationAddress,
      estimatedDelivery,
      status: ShippingStatus.PREPARING,
    });

    return this.shippingRepository.save(shipping);
  }

  async findByOrder(orderId: number) {
    const shipping = await this.shippingRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order'],
    });
    if (!shipping) throw new NotFoundException('Envío no encontrado');
    return shipping;
  }

  async updateStatus(id: number, updateStatusDto: UpdateStatusDto) {
    const shipping = await this.shippingRepository.findOne({
      where: { id },
    });
    if (!shipping) throw new NotFoundException('Envío no encontrado');

    // Guardar historial
    const history = this.historyRepository.create({
      shipping,
      previousStatus: shipping.status,
      newStatus: updateStatusDto.status,
      observation: updateStatusDto.observation,
    });
    await this.historyRepository.save(history);

    // Si se entrega, guardar fecha
    if (updateStatusDto.status === ShippingStatus.DELIVERED) {
      shipping.deliveredAt = new Date();
    }

    shipping.status = updateStatusDto.status;
    await this.shippingRepository.save(shipping);

    return { message: 'Estado actualizado exitosamente', shipping };
  }

  async getHistory(id: number) {
    return this.historyRepository.find({
      where: { shipping: { id } },
      order: { changedAt: 'DESC' },
    });
  }
}