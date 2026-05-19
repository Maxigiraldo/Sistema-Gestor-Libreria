import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return, ReturnStatus } from './return.entity';
import { Shipping, ShippingStatus } from '../shipping/shipping.entity';
import { CreateReturnDto } from './dto/create-return.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
  ) {}

  async create(createReturnDto: CreateReturnDto, userId: number) {
    const { orderId, cause, additionalDescription } = createReturnDto;

    // Verificar que el envío existe y fue entregado
    const shipping = await this.shippingRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (!shipping) {
      throw new NotFoundException('Envío no encontrado');
    }

    if (shipping.status !== ShippingStatus.DELIVERED) {
      throw new BadRequestException(
        'Solo puedes devolver productos que ya fueron entregados',
      );
    }

    // Verificar límite de 8 días
    const deliveredAt = shipping.deliveredAt;
    const deadlineDate = new Date(deliveredAt);
    deadlineDate.setDate(deadlineDate.getDate() + 8);
    const now = new Date();

    if (now > deadlineDate) {
      throw new BadRequestException(
        'El plazo de 8 días para devoluciones ha vencido',
      );
    }

    // Generar código QR
    const qrData = `DEVOLUCION-ORDEN-${orderId}-USUARIO-${userId}-${Date.now()}`;
    const qrCode = await QRCode.toDataURL(qrData);

    const returnRequest = this.returnRepository.create({
      order: { id: orderId },
      client: { id: userId },
      cause,
      additionalDescription,
      qrCode,
      deadlineDate,
      status: ReturnStatus.PENDING,
    });

    const saved = await this.returnRepository.save(returnRequest);

    return {
      message: 'Solicitud de devolución creada exitosamente',
      return: saved,
      qrCode,
    };
  }

  async findByUser(userId: number) {
    return this.returnRepository.find({
      where: { client: { id: userId } },
      relations: ['order'],
    });
  }

  async updateStatus(id: number, status: ReturnStatus) {
    const returnRequest = await this.returnRepository.findOne({
      where: { id },
    });
    if (!returnRequest) throw new NotFoundException('Devolución no encontrada');
    returnRequest.status = status;
    return this.returnRepository.save(returnRequest);
  }
}

