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
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

// Solo clientes pueden reservar
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('cart/add')
  addToCart(@Body() dto: AddToCartDto, @Request() req) {
    return this.reservationsService.addToCart(dto.exemplarId, req.user.sub);
  }

  @Delete('cart/item/:exemplarId')
  removeFromCart(@Param('exemplarId', ParseIntPipe) exemplarId: number, @Request() req) {
    return this.reservationsService.removeFromCart(exemplarId, req.user.sub);
  }

  @Post()
  create(@Body() createReservationDto: CreateReservationDto, @Request() req) {
    return this.reservationsService.create(createReservationDto, req.user.sub);
  }

  @Get()
  findMyReservations(@Request() req) {
    return this.reservationsService.findByUser(req.user.sub);
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.reservationsService.cancel(id, req.user.sub);
  }
}