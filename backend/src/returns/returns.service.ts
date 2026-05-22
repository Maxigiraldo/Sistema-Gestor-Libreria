import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return, ReturnStatus, RefundMethod } from './return.entity';
import { Shipping, ShippingStatus } from '../shipping/shipping.entity';
import { User } from '../users/user.entity';
import { Balance } from '../payments/balance.entity';
import { Order } from '../orders/order.entity';
import { CreateReturnDto } from './dto/create-return.dto';
import { MailService } from '../mail/mail.service';
import * as QRCode from 'qrcode';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private mailService: MailService,
  ) {}

  async create(createReturnDto: CreateReturnDto, userId: number) {
    const { orderId, cause, additionalDescription, refundMethod } = createReturnDto;

    const shipping = await this.shippingRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (!shipping) throw new NotFoundException('Envío no encontrado');

    if (shipping.status !== ShippingStatus.DELIVERED) {
      throw new BadRequestException('Solo puedes devolver productos que ya fueron entregados');
    }

    const deliveredAt = shipping.deliveredAt;
    const deadlineDate = new Date(deliveredAt);
    deadlineDate.setDate(deadlineDate.getDate() + 8);

    if (new Date() > deadlineDate) {
      throw new BadRequestException('El plazo de 8 días para devoluciones ha vencido');
    }

    // Remove any prior failed attempt (partial record with no qrCode)
    const failed = await this.returnRepository.findOne({
      where: { order: { id: orderId }, client: { id: userId }, qrCode: null as any },
    });
    if (failed) await this.returnRepository.delete(failed.id);

    // Existing completed return blocks re-submission
    const existing = await this.returnRepository.findOne({
      where: { order: { id: orderId }, client: { id: userId } },
    });
    if (existing) throw new BadRequestException('Ya existe una solicitud de devolución para este pedido');

    // Save first to get the ID, then generate QR and update in a single round-trip
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

    const returnRequest = this.returnRepository.create({
      order: { id: orderId },
      client: { id: userId },
      cause,
      additionalDescription,
      refundMethod: refundMethod ?? RefundMethod.BALANCE,
      deadlineDate,
      status: ReturnStatus.PENDING,
    });

    const saved = await this.returnRepository.save(returnRequest);

    const trackingUrl = `${frontendUrl}/devolucion/${saved.id}`;
    const qrCode = await QRCode.toDataURL(trackingUrl);
    saved.qrCode = qrCode;
    await this.returnRepository.save(saved);

    // Send QR by email (non-blocking)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      this.mailService.sendReturnQr(user.email, user.username, orderId, saved.id, qrCode, trackingUrl)
        .catch(() => {});
    }

    return { message: 'Solicitud de devolución creada exitosamente', return: saved, qrCode };
  }

  async findById(id: number, userId: number) {
    const ret = await this.returnRepository.findOne({
      where: { id, client: { id: userId } },
      relations: ['order'],
    });
    if (!ret) throw new NotFoundException('Devolución no encontrada');
    return ret;
  }

  async findByUser(userId: number) {
    return this.returnRepository.find({
      where: { client: { id: userId } },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll() {
    return this.returnRepository.find({
      relations: ['order', 'client'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: ReturnStatus) {
    const returnRequest = await this.returnRepository.findOne({
      where: { id },
      relations: ['client', 'order'],
    });
    if (!returnRequest) throw new NotFoundException('Devolución no encontrada');

    // Reembolso al saldo cuando se aprueba y el método elegido es saldo
    if (status === ReturnStatus.APPROVED && returnRequest.refundMethod === RefundMethod.BALANCE) {
      const order = await this.orderRepository.findOne({ where: { id: returnRequest.order.id } });
      if (order) {
        let balance = await this.balanceRepository.findOne({
          where: { client: { id: returnRequest.client.id } },
        });
        if (!balance) {
          balance = this.balanceRepository.create({
            client: { id: returnRequest.client.id } as any,
            available: 0,
          });
        }
        balance.available = Number(balance.available) + Number(order.total);
        await this.balanceRepository.save(balance);
      }
    }

    returnRequest.status = status;
    return this.returnRepository.save(returnRequest);
  }
}
