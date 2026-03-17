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

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  create(@Body() createReturnDto: CreateReturnDto, @Request() req) {
    return this.returnsService.create(createReturnDto, req.user.sub);
  }

  @Get()
  findMyReturns(@Request() req) {
    return this.returnsService.findByUser(req.user.sub);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ReturnStatus,
  ) {
    return this.returnsService.updateStatus(id, status);
  }
}