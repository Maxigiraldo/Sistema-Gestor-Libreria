import {
  Controller, Get, Post, Patch,
  Body, Param, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user.entity';
import { Request } from '@nestjs/common'; 

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ROOT)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto);
  }

  @Get('admins')
  listAdmins() {
    return this.usersService.listAdmins();
  }

  @Patch('admins/:id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivateAdmin(id);
  }

  @Get('me/profile')
  @Roles(UserRole.CLIENT)  
  getMyProfile(@Request() req) {
  return this.usersService.getClientProfile(req.user.sub);
  }
}