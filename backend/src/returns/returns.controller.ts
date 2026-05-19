import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { ReturnStatus } from './return.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  // Solo clientes solicitan devoluciones
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  create(@Body() createReturnDto: CreateReturnDto, @Request() req) {
    return this.returnsService.create(createReturnDto, req.user.sub);
  }

  // Cliente ve sus devoluciones
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CLIENT)
  findMyReturns(@Request() req) {
    return this.returnsService.findByUser(req.user.sub);
  }

  // Solo admin actualiza estado de devolución
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ROOT)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ReturnStatus,
  ) {
    return this.returnsService.updateStatus(id, status);
  }
}