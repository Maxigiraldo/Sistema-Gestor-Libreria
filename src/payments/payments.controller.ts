import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateCardDto } from './dto/create-card.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

// Solo clientes gestionan pagos
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('cards')
  addCard(@Body() createCardDto: CreateCardDto, @Request() req) {
    return this.paymentsService.addCard(createCardDto, req.user.sub);
  }

  @Get('cards')
  getCards(@Request() req) {
    return this.paymentsService.getCards(req.user.sub);
  }

  @Delete('cards/:id')
  removeCard(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.paymentsService.removeCard(id, req.user.sub);
  }

  @Get('balance')
  getBalance(@Request() req) {
    return this.paymentsService.getBalance(req.user.sub);
  }

  @Post('process')
  processPayment(@Body() createPaymentDto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.processPayment(createPaymentDto, req.user.sub);
  }
}
