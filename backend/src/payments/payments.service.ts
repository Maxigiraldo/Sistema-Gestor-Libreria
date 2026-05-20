import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity';
import { Card, CardType } from './card.entity';
import { Balance } from './balance.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CheckoutPaymentMethod } from '../orders/dto/create-order.dto';

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

  async topup(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('El monto debe ser mayor a 0');
    const balance = await this.getBalance(userId);
    balance.available = Number(balance.available) + amount;
    return this.balanceRepository.save(balance);
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

  private detectBrand(cardNumber: string): string {
    const n = cardNumber.replace(/\s/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'American Express';
    return 'Unknown';
  }

  async processOrderPayment(
    userId: number,
    total: number,
    paymentMethod: CheckoutPaymentMethod,
    cardData?: {
      cardNumber?: string;
      cardHolderName?: string;
      cardExpiry?: string;
      cardType?: string;
      saveCard?: boolean;
    },
    savedCardId?: number,
  ): Promise<void> {
    let remaining = total;

    // Step 1: deduct from balance if applicable
    if (paymentMethod === CheckoutPaymentMethod.BALANCE || paymentMethod === CheckoutPaymentMethod.MIXED) {
      const balance = await this.getBalance(userId);
      const available = Number(balance.available);

      if (paymentMethod === CheckoutPaymentMethod.BALANCE && available < total) {
        throw new BadRequestException('Saldo insuficiente para cubrir el pedido');
      }

      const fromBalance = paymentMethod === CheckoutPaymentMethod.BALANCE
        ? total
        : Math.min(available, total);

      balance.available = available - fromBalance;
      await this.balanceRepository.save(balance);

      const balancePayment = this.paymentRepository.create({
        client: { id: userId },
        amount: fromBalance,
        method: PaymentMethod.BALANCE,
        status: PaymentStatus.APPROVED,
        gatewayReference: `BAL-${Date.now()}`,
      });
      await this.paymentRepository.save(balancePayment);

      remaining -= fromBalance;
    }

    // Step 2: charge card if there's a remaining amount
    if ((paymentMethod === CheckoutPaymentMethod.CARD || paymentMethod === CheckoutPaymentMethod.MIXED) && remaining > 0) {
      let lastDigits = '';
      let brand = '';
      let expiryDate: Date;
      let cardType: CardType = CardType.CREDIT;

      if (savedCardId) {
        const saved = await this.cardRepository.findOne({
          where: { id: savedCardId, client: { id: userId }, active: true },
        });
        if (!saved) throw new NotFoundException('Tarjeta guardada no encontrada');
        lastDigits = saved.lastDigits;
        brand = saved.brand;
        expiryDate = new Date(saved.expiryDate);
        cardType = saved.type;
      } else if (cardData?.cardNumber) {
        const num = cardData.cardNumber.replace(/\s/g, '');
        lastDigits = num.slice(-4);
        brand = this.detectBrand(num);
        const [mm, yy] = (cardData.cardExpiry ?? '01/25').split('/');
        expiryDate = new Date(`20${yy}-${mm}-01`);
        cardType = cardData.cardType === 'debito' ? CardType.DEBIT : CardType.CREDIT;

        // Simulate decline: cards ending in 0002
        if (lastDigits === '0002') {
          const declined = this.paymentRepository.create({
            client: { id: userId },
            amount: remaining,
            method: PaymentMethod.CARD,
            status: PaymentStatus.REJECTED,
            gatewayReference: `DECLINED-${Date.now()}`,
          });
          await this.paymentRepository.save(declined);
          throw new BadRequestException(
            'Tarjeta declinada. Verifica los datos o usa otro método de pago.',
          );
        }

        // Optionally save card
        if (cardData.saveCard) {
          const exists = await this.cardRepository.findOne({
            where: { client: { id: userId }, lastDigits, active: true },
          });
          if (!exists) {
            const card = this.cardRepository.create({
              client: { id: userId },
              type: cardType,
              gatewayToken: `tok_${num.slice(0, 4)}_${lastDigits}_${Date.now()}`,
              lastDigits,
              brand,
              expiryDate,
            });
            await this.cardRepository.save(card);
          }
        }
      } else {
        throw new BadRequestException('Se requieren datos de tarjeta para completar el pago');
      }

      const cardPayment = this.paymentRepository.create({
        client: { id: userId },
        amount: remaining,
        method: PaymentMethod.CARD,
        status: PaymentStatus.APPROVED,
        gatewayReference: `CARD-${lastDigits}-${Date.now()}`,
      });
      await this.paymentRepository.save(cardPayment);
    }
  }
}
