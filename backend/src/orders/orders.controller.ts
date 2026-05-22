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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user.sub);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN, UserRole.ROOT)
  findAllForAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Get()
  @Roles(UserRole.CLIENT)
  findMyOrders(@Request() req) {
    return this.ordersService.findByUser(req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.ordersService.findOne(id, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.CLIENT)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() body?: { reason?: string; refundMethod?: 'balance' | 'card' },
  ) {
    return this.ordersService.cancel(id, req.user.sub, body?.reason, body?.refundMethod);
  }
}