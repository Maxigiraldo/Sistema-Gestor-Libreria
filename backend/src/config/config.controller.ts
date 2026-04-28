import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('bonus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  getBonus() {
    return this.configService.getBonus();
  }

  @Put('bonus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ROOT, UserRole.ADMIN)
  updateBonus(@Body('percentage') percentage: number) {
    return this.configService.updateBonus(Number(percentage));
  }
}
