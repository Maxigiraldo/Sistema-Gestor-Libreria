import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { Card } from './card.entity';
import { Balance } from './balance.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Card)
    private cardRepository: Repository<Card>,
    @InjectRepository(Balance)
    private balanceRepository: Repository<Balance>,
  ) {}

  async addCard(createCardDto: CreateCardDto, userId: number) {
    const card = this.cardRepository.create({
      client: { id: userId },
      ...createCardDto,
      expiryDate: new Date(createCardDto.expiryDate),
    });
    return this.cardRepository.save(card);
  }

  async getCards(userId: number) {
    return this.cardRepository.find({
      where: { client: { id: userId }, active: true },
    });
  }

  async removeCard(id: number, userId: number) {
    const card = await this.cardRepository.findOne({
      where: { id, client: { id: userId } },
    });
    if (!card) throw new NotFoundException('Tarjeta no encontrada');
    card.active = false;
    await this.cardRepository.save(card);
    return { message: 'Tarjeta eliminada exitosamente' };
  }

  async getBalance(userId: number) {
    let balance = await this.balanceRepository.findOne({
      where: { client: { id: userId } },
    });
    if (!balance) {
      balance = this.balanceRepository.create({
        client: { id: userId },
        available: 0,
      });
      await this.balanceRepository.save(balance);
    }
    return balance;
  }

  async processPayment(createPaymentDto: CreatePaymentDto, userId: number) {
    const { amount, method } = createPaymentDto;

    if (method === 'saldo') {
      const balance = await this.getBalance(userId);
      if (Number(balance.available) < amount) {
        throw new BadRequestException('Saldo insuficiente');
      }
      balance.available = Number(balance.available) - amount;
      await this.balanceRepository.save(balance);
    }

    const payment = this.paymentRepository.create({
      client: { id: userId },
      amount,
      method,
      status: PaymentStatus.APPROVED,
      gatewayReference: `REF-${Date.now()}`,
    });

    return this.paymentRepository.save(payment);
  }
}